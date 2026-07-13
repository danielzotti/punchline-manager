import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { getSupabaseServer } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { collectionId } = await req.json();
    if (!collectionId) return NextResponse.json({ error: 'Missing collectionId' }, { status: 400 });

    // Auth check
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: collection, error } = await supabase
      .from('collections')
      .select('*, collection_items(*, punchline:punchlines(*))')
      .eq('id', collectionId)
      .single();

    if (error || !collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Sort items
    const items = [...(collection.collection_items || [])].sort((a, b) => a.position - b.position);

    // Build HTML string for the PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${collection.title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: black;
            background: white;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
          }
          h1 {
            text-align: center;
            margin-bottom: 5px;
          }
          .date {
            text-align: center;
            color: #555;
            font-size: 14px;
            margin-bottom: 40px;
          }
          .item-block {
            margin-bottom: 20px;
          }
          /* RTE Specific basic styles */
          .item-block p {
            margin: 0 0 1em 0;
          }
          .item-block b, .item-block strong { font-weight: bold; }
          .item-block i, .item-block em { font-style: italic; }
          .item-block u { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>${collection.title}</h1>
        <div class="date">${new Date(collection.date).toLocaleDateString()}</div>
        <div class="content">
    `;

    items.forEach(item => {
      htmlContent += `<div class="item-block">`;
      if (item.item_type === 'punchline' && item.punchline) {
        htmlContent += item.punchline.text;
      } else if (item.item_type === 'linked_text' && item.text_content) {
        htmlContent += item.text_content;
      }
      htmlContent += `</div>`;
    });

    htmlContent += `
        </div>
      </body>
      </html>
    `;

    // Launch puppeteer to generate PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${collection.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
      },
    });

  } catch (err: any) {
    console.error('PDF Export Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
