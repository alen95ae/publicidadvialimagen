import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Verificar que es un enlace corto de Google Maps
    if (!url.includes('goo.gl') && !url.includes('maps.app.goo.gl')) {
      return NextResponse.json({ error: 'Not a Google Maps short URL' }, { status: 400 });
    }

    console.log('🔗 Expanding URL on server:', url);

    // Usar fetch desde el servidor (sin restricciones CORS)
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; URLExpander/1.0)',
      },
    });

    if (response.ok) {
      const expandedUrl = response.url;
      console.log('✅ URL expanded successfully:', expandedUrl);
      
      return NextResponse.json({ 
        success: true, 
        expandedUrl,
        originalUrl: url 
      });
    } else {
      console.log('❌ Failed to expand URL:', response.status);
      return NextResponse.json({ 
        error: 'Failed to expand URL',
        status: response.status 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Error expanding URL:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
