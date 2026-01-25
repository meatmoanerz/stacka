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
      // For PDF files, convert to base64 and use GPT-4o vision
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')

      console.log(`Processing PDF: ${file.name}, size: ${arrayBuffer.byteLength} bytes`)

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
                text: 'Analysera detta kontoutdrag och extrahera alla transaktioner enligt instruktionerna.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4096
      })
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

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    const transactions: ParsedTransaction[] = result.transactions || []

    console.log(`Transactions found: ${transactions.length}`)

    if (transactions.length > 0) {
      const transactionRows = transactions.map((t) => ({
        analysis_id: analysis.id,
        date: t.date,
        description: t.description,
        amount: Math.abs(t.amount),
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
          transaction_count: transactions.length
        })
        .eq('id', analysis.id)
    } else {
      await supabaseAdmin
        .from('statement_analyses')
        .update({ status: 'completed' })
        .eq('id', analysis.id)
    }

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      transactionCount: transactions.length
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
