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
      method: 'GET', // Cambiar a GET para mejor compatibilidad
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'no-cache',
      },
      // Timeout de 15 segundos
      signal: AbortSignal.timeout(15000),
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
      console.log('❌ Failed to expand URL with direct method, trying alternative...');
      
      // Método alternativo usando un servicio público
      try {
        const altResponse = await fetch(`https://api.unshorten.it/unshorten?url=${encodeURIComponent(url)}`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: AbortSignal.timeout(10000),
        });
        
        if (altResponse.ok) {
          const altData = await altResponse.text();
          if (altData && altData.startsWith('http')) {
            console.log('✅ URL expanded with alternative method:', altData);
            return NextResponse.json({ 
              success: true, 
              expandedUrl: altData,
              originalUrl: url 
            });
          }
        }
      } catch (altError) {
        console.log('❌ Alternative method also failed:', altError);
      }
      
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
