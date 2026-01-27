import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { getBankConfig } from '@/lib/statement/bank-configs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  cardholder?: string
  reference?: string
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bankId = formData.get('bankId') as string
    const userId = formData.get('userId') as string

    if (!file || !bankId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const bankConfig = getBankConfig(bankId)
    if (!bankConfig) {
      return NextResponse.json({ error: 'Unknown bank' }, { status: 400 })
    }

    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('statement_analyses')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_type: file.name.endsWith('.pdf') ? 'PDF' : 'CSV',
        bank_name: bankConfig.name,
        status: 'processing',
        transaction_count: 0,
      })
      .select()
      .single()

    if (analysisError) throw analysisError

    const isPdf = file.name.toLowerCase().endsWith('.pdf')
    let completion

    if (isPdf) {
      // Use OpenAI's native PDF support (available since March 2025)
      // This handles both text-based and scanned PDFs via vision capabilities
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')

      console.log(`Processing PDF: ${file.name}, size: ${arrayBuffer.byteLength} bytes`)

      // OpenAI extracts text and images from each page automatically
      // Using gpt-4o for better PDF analysis (vision capabilities required)
      completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: bankConfig.prompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analysera detta kontoutdrag och extrahera alla transaktioner enligt instruktionerna. Returnera svaret som JSON.'
              },
              {
                type: 'file',
                file: {
                  filename: file.name,
                  file_data: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 8192
      })

      console.log('OpenAI PDF analysis completed')
    } else {
      // For CSV files, send as text
      const fileContent = await file.text()
      console.log(`Processing CSV: ${file.name}, length: ${fileContent.length} chars`)

      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: bankConfig.prompt
          },
          {
            role: 'user',
            content: `Här är kontoutdraget:\n\n${fileContent}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    }

    const rawContent = completion.choices[0].message.content || '{}'
    console.log('OpenAI raw response length:', rawContent.length)

    const result = JSON.parse(rawContent)
    const transactions: ParsedTransaction[] = result.transactions || []
    const invoiceTotal: number | null = result.invoice_total ?? null

    // Sort transactions by date (ascending - oldest first)
    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calculate sum for verification
    const calculatedSum = sortedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

    console.log(`Transactions found: ${sortedTransactions.length}`)
    console.log(`Invoice total from PDF: ${invoiceTotal}`)
    console.log(`Calculated sum: ${calculatedSum.toFixed(2)}`)
    if (invoiceTotal) {
      const diff = Math.abs(invoiceTotal - calculatedSum)
      console.log(`Difference: ${diff.toFixed(2)} (${diff < 1 ? '✓ OK' : '⚠ MISMATCH'})`)
    }

    // Log first 5 transactions for debugging
    console.log('First 5 transactions:')
    sortedTransactions.slice(0, 5).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.date} | ${t.description} | ${t.amount} | ${t.cardholder?.split(' ')[0]}`)
    })

    if (sortedTransactions.length > 0) {
      const transactionRows = sortedTransactions.map((t) => ({
        analysis_id: analysis.id,
        date: t.date,
        description: t.description,
        amount: Math.abs(t.amount),
        cardholder: t.cardholder || null,
        cost_assignment: 'shared' as const,
        is_expense: t.amount > 0,
        is_saved: false,
        suggested_category_id: null,
        confirmed_category_id: null,
      }))

      await supabaseAdmin
        .from('statement_transactions')
        .insert(transactionRows)

      await supabaseAdmin
        .from('statement_analyses')
        .update({
          status: 'completed',
          transaction_count: sortedTransactions.length,
          invoice_total: invoiceTotal
        })
        .eq('id', analysis.id)
    } else {
      await supabaseAdmin
        .from('statement_analyses')
        .update({
          status: 'completed',
          invoice_total: invoiceTotal
        })
        .eq('id', analysis.id)
    }

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      transactionCount: sortedTransactions.length,
      invoiceTotal,
      calculatedSum: parseFloat(calculatedSum.toFixed(2))
    })

  } catch (error) {
    console.error('Statement analysis error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({
      error: 'Failed to analyze statement',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
