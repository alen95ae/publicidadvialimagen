import { Locale } from './i18n';

export const translations = {
  es: {
    // Navigation
    nav: {
      home: 'Inicio',
      billboards: 'Vallas Publicitarias',
      printShop: 'Impresión Digital',
      about: 'Nosotros',
      contact: 'Contacto',
      search: 'Buscar...',
      cart: 'Carrito',
      menu: 'Menú'
    },
    // Common
    common: {
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      cancel: 'Cancelar',
      save: 'Guardar',
      edit: 'Editar',
      delete: 'Eliminar',
      view: 'Ver más',
      more: 'Más',
      less: 'Menos',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      submit: 'Enviar',
      continue: 'Continuar',
      finish: 'Finalizar'
    },
    // Homepage
    home: {
      hero: {
        title: 'Vallas publicitarias en Bolivia',
        subtitle: 'Potencia tu marca con nuestros espacios publicitarios estratégicamente ubicados en las mejores ubicaciones de Bolivia',
        cta: 'Explorar Soportes',
        ctaSecondary: 'Solicitar Cotización'
      },
      featuredBillboards: {
        title: 'Espacios publicitarios destacados',
        quote: 'Cotizar',
        viewMore: 'Ver más'
      },
      whyOutdoor: {
        title: '¿Por qué Publicidad Exterior?',
        subtitle: 'Resultados medibles y comprobados que impulsan el reconocimiento de tu marca.',
        reach: {
          title: 'Alcance Efectivo',
          value: '97%',
          description: 'La publicidad exterior alcanza al 97% de los adultos en las principales ciudades.'
        },
        visibility: {
          title: 'Mayor Visibilidad',
          value: '70%',
          description: '70% de las personas recuerdan haber visto un espectacular en la última semana.'
        },
        recall: {
          title: 'Alto Recuerdo',
          value: '55%',
          description: '55% de los consumidores son más propensos a recordar marcas en publicidad exterior.'
        },
        roi: {
          title: 'ROI Superior',
          value: '5x',
          description: 'El retorno de inversión en publicidad exterior supera 5 veces a otros medios tradicionales.'
        }
      },
      features: {
        title: '¿Por qué elegirnos?',
        strategic: {
          title: 'Ubicaciones Estratégicas',
          description: 'Nuestras vallas están ubicadas en puntos de alto tráfico vehicular y peatonal'
        },
        quality: {
          title: 'Alta Calidad',
          description: 'Materiales premium y acabados profesionales que garantizan durabilidad'
        },
        coverage: {
          title: 'Amplia Cobertura',
          description: 'Presencia en las principales ciudades de Bolivia'
        },
        securePayment: {
          title: 'Pago Seguro',
          description: 'Procesos de pago seguros y confiables para tu tranquilidad'
        }
      }
    },
    // Billboards
    billboards: {
      title: 'Vallas Publicitarias',
      subtitle: 'Compara soportes disponibles en tu ciudad',
      search: 'Buscar ubicación...',
      filter: 'Filtrar por',
      city: 'Ciudad',
      type: 'Tipo de valla',
      size: 'Tamaño',
      price: 'Precio',
      availability: 'Disponibilidad',
      viewDetails: 'Ver Detalles',
      requestQuote: 'Cotizar',
      addToCart: 'Agregar al Carrito',
      categories: {
        unipolar: 'Unipolar',
        bipolar: 'Bipolar',
        tripolar: 'Tripolar',
        mural: 'Mural',
        megaValla: 'Mega Valla',
        cartelera: 'Cartelera',
        paleta: 'Paleta'
      },
      // Página de vallas publicitarias
      page: {
        title: 'Vallas Publicitarias',
        subtitle: 'Compara soportes disponibles en tu ciudad',
        breadcrumb: 'Vallas Publicitarias',
        loadingMap: 'Cargando mapa...',
        showMap: 'Mostrar mapa',
        hideMap: 'Ocultar mapa',
        locationTitle: 'Ubicación de Espacios Publicitarios',
        filters: 'Filtros',
        clearAll: 'Limpiar todo',
        activeFilters: 'Filtros activos',
        noResults: 'No se encontraron vallas',
        noResultsDesc: 'Intenta ajustar tus filtros para encontrar lo que buscas.',
        clearFilters: 'Limpiar todos los filtros',
        sortBy: 'Ordenar por',
        featured: 'Destacados',
        priceLow: 'Precio: Menor a Mayor',
        priceHigh: 'Precio: Mayor a Menor',
        newest: 'Más recientes',
        products: 'vallas',
        // Filtros
        filters: 'Filtros',
        clearAll: 'Limpiar todo',
        availability: 'Disponibilidad',
        availableNow: 'Disponible ahora',
        comingSoon: 'Próximamente',
        sortBy: 'Ordenar por',
        popular: 'Populares',
        highestTraffic: 'Mayor Tráfico',
        alphabeticalAZ: 'Alfabético A-Z',
        alphabeticalZA: 'Alfabético Z-A',
        materialType: 'Tipo de Material',
        recommendedUse: 'Uso Recomendado',
        durability: 'Durabilidad',
        characteristics: 'Características',
        // Detalles de valla
        dimensions: 'Dimensiones',
        format: 'Formato',
        monthlyPrice: 'Precio mensual',
        city: 'Ciudad',
        location: 'Ubicación',
        description: 'Descripción',
        features: 'Características',
        specifications: 'Especificaciones',
        // Botones
        reserve: 'Reservar',
        addToCart: 'Agregar al Carrito',
        back: 'Volver',
        // Estados
        available: 'Disponible',
        reserved: 'Reservado',
        sold: 'Vendido',
        // Página de producto
        backToSpaces: 'Volver a espacios',
        spaceCharacteristics: 'Características del espacio',
        dimension: 'Dimensión',
        supportType: 'Tipo de soporte',
        dailyImpacts: 'Impactos diarios',
        lighting: 'Iluminación',
        quoteSpace: 'Cotizar espacio',
        startDate: 'Fecha de inicio',
        selectDate: 'Seleccionar fecha',
        rentalMonths: 'Meses de alquiler',
        additionalServices: 'Servicios adicionales (se pagan al inicio)',
        graphicDesign: 'Diseño gráfico',
        bannerPrinting: 'Impresión de lona',
        billboardInstallation: 'Instalación en valla',
        similarSupports: 'Otros soportes similares',
        requestQuote: 'Cotizar'
      }
    },
    // Print Shop
    printShop: {
      title: 'Impresión Digital',
      subtitle: 'Nuestras categorias de vallas publicitarias',
      services: {
        banners: 'Banners',
        posters: 'Afiches',
        stickers: 'Stickers',
        businessCards: 'Tarjetas de Presentación',
        flyers: 'Volantes',
        exploreServices: 'Explorar Servicios'
      },
      features: {
        durability: 'Materiales de alta durabilidad',
        delivery: 'Entrega rápida garantizada',
        finishes: 'Acabados profesionales'
      },
      // Página de impresión
      page: {
        title: 'Servicios de Impresión',
        subtitle: 'Materiales de impresión profesional calculados por metro cuadrado',
        breadcrumb: 'Impresión',
        filters: 'Filtros',
        clearAll: 'Limpiar todo',
        materialType: 'Tipo de Material',
        pricePerM2: 'Precio por m² (€)',
        recommendedUse: 'Uso Recomendado',
        durability: 'Durabilidad',
        characteristics: 'Características',
        sortBy: 'Ordenar por',
        featured: 'Destacados',
        priceLow: 'Precio: Menor a Mayor',
        priceHigh: 'Precio: Mayor a Menor',
        fastDelivery: 'Entrega más rápida',
        noProducts: 'No se encontraron productos',
        noProductsDesc: 'Intenta ajustar tus filtros para encontrar lo que buscas.',
        clearFilters: 'Limpiar todos los filtros',
        products: 'productos',
        reserve: 'Reservar',
        // Modo mantenimiento
        comingSoon: 'Próximamente',
        underConstruction: 'Página en Construcción',
        constructionDesc: 'Estamos trabajando para traerte nuestros servicios de impresión digital. Muy pronto podrás disfrutar de materiales de alta calidad para tus proyectos publicitarios.',
        calculationPerM2: 'Cálculo por m²',
        calculationDesc: 'Precios transparentes calculados exactamente',
        highQuality: 'Alta Calidad',
        qualityDesc: 'Materiales profesionales y duraderos',
        fastDeliveryTitle: 'Entrega Rápida',
        deliveryDesc: 'Tiempos de producción optimizados',
        backToHome: 'Volver al Inicio'
      }
    },
    // About
    about: {
      title: 'Nosotros',
      subtitle: 'Conoce más sobre Publicidad Vial Imagen',
      mission: 'Nuestra Misión',
      vision: 'Nuestra Visión',
      values: 'Nuestros Valores',
      // Página about
      page: {
        breadcrumb: 'Sobre nosotros',
        ourStory: 'Nuestra historia',
        ourStoryDesc1: 'Publicidad Vial Imagen una empresa con 36 años de experiencia en el sector de la publicidad. Disponemos de espacios publicitarios en vía pública para ayudar a nuestros clientes a promocionar su marca, productos y servicios.',
        ourStoryDesc2: 'Disponemos de última tecnología para proporcionar a nuestros clientes una publicidad de alto impacto y efectiva de forma rápida y sencilla.',
        ourStoryDesc3: 'Nos tomamos la publicidad en serio, por eso ofrecemos productos de calidad y un excelente servicio al cliente. Nuestro equipo de profesionales está aquí para ayudarle con cualquier pregunta o inquietud. ¡No dude en contactar con nosotros si desea obtener más información sobre cómo podemos ayudarle a llevar su publicidad al siguiente nivel!',
        ourCompany: 'Nuestra empresa',
        ourCompanyDesc1: 'Publicidad Vial Imagen S.R.L. se encuentra a la vanguardia de la publicidad boliviana desde 1989.',
        ourCompanyDesc2: 'Martín Sillerico, Gerente General y fundador, a través de varias líneas de negocio ha logrado posicionarse a nivel nacional con su amplia gama de productos y servicios.',
        ourCompanyDesc3: 'Generamos ideas, las diseñamos y las plasmamos, elaborando y produciendo conceptos de marketing con valor para nuestros clientes.',
        ourCompanyDesc4: 'Somos una empresa líder en servicios integrales de publicidad a nivel nacional, reconocida por su capacidad tecnológica y calidad humana que contribuye día a día al desarrollo económico del país.',
        generalManager: 'Gerente General',
        ourValues: 'Nuestros valores',
        ourValuesDesc: 'En Publicidad Vial Imagen, nuestros valores fundamentales guían todo lo que hacemos, desde la selección de espacios hasta el servicio al cliente.',
        commitment: 'Compromiso',
        commitmentDesc: 'Nos comprometemos con el éxito de nuestros clientes, ofreciendo soluciones publicitarias efectivas y de calidad.',
        qualityGuaranteed: 'Calidad garantizada',
        qualityDesc: 'Todos nuestros espacios y servicios cumplen los más altos estándares de calidad y efectividad publicitaria.',
        customerFocus: 'Enfoque al cliente',
        customerDesc: 'Estamos dedicados a proporcionar un servicio excepcional y construir relaciones duraderas con nuestros clientes.',
        reliability: 'Confiabilidad',
        reliabilityDesc: 'Cumplimos nuestras promesas con entrega rápida, instalaciones precisas y soporte al cliente responsivo.',
        ourTeam: 'Nuestro equipo',
        ourTeamDesc: 'Conoce al equipo de profesionales que hace posible nuestro éxito día a día.',
        ourTeamText: 'En Publicidad Vial Imagen contamos con un equipo multidisciplinario de profesionales altamente capacitados, comprometidos con la excelencia y la innovación. Cada miembro de nuestro equipo aporta su experiencia y dedicación para brindar soluciones publicitarias de calidad que superan las expectativas de nuestros clientes. Trabajamos juntos con pasión y profesionalismo para hacer realidad cada proyecto publicitario.'
      }
    },
    // Contact
    contact: {
      title: 'Contacto',
      subtitle: 'Ponte en contacto con nosotros',
      quote: {
        title: '¿Listo para impulsar tu marca?',
        titleHighlight: 'impulsar',
        subtitle: 'Solicita una consulta gratuita y descubre cómo la publicidad exterior puede transformar el alcance de tu marca.',
        benefits: {
          consultation: 'Consulta inicial sin costo',
          proposal: 'Propuesta personalizada en menos de 24h',
          prices: 'Precios competitivos y flexibles'
        },
        formTitle: 'Solicita tu cotización',
        privacy: 'Al enviar este formulario, aceptas nuestras políticas de privacidad.',
        send: 'Enviar Solicitud'
      },
      form: {
        name: 'Nombre completo',
        namePlaceholder: 'Tu nombre',
        email: 'Correo electrónico',
        emailPlaceholder: 'tu@email.com',
        phone: 'Teléfono',
        phonePlaceholder: '+591 2 1234-5678',
        company: 'Empresa',
        companyPlaceholder: 'Nombre de tu empresa',
        message: 'Mensaje (opcional)',
        messagePlaceholder: 'Cuéntanos más sobre tu proyecto...',
        send: 'Enviar Mensaje'
      },
      info: {
        address: 'Dirección',
        phone: 'Teléfono',
        email: 'Email',
        hours: 'Horarios de Atención'
      },
      // Página de contacto
      page: {
        title: 'Contacto',
        subtitle: '¿Tienes alguna pregunta? Nos encantaría escucharte. Envíanos un mensaje y te responderemos lo antes posible.',
        sendMessage: 'Envíanos un Mensaje',
        thanks: '¡Gracias!',
        thanksDesc: 'Tu mensaje ha sido enviado exitosamente. Te responderemos lo antes posible.',
        namePlaceholder: 'Tu nombre',
        emailPlaceholder: 'tu@email.com',
        phonePlaceholder: 'Tu teléfono',
        companyPlaceholder: 'Tu empresa',
        messagePlaceholder: 'Escribe tu mensaje aquí (máx. 500 caracteres)',
        sending: 'Enviando...',
        sendMessageBtn: 'Enviar Mensaje',
        followUs: 'Síguenos en Redes Sociales',
        branches: 'Sucursales',
        branchLocation: 'Ubicación de Nuestras Sucursales',
        // La Paz
        laPaz: 'La Paz',
        laPazAddress: 'C. Nicolás Acosta Esq. Pedro Blanco<br />(Alto San Pedro) N° 1471<br />La Paz, Bolivia',
        laPazPhones: '(591-2) 2493155 – 2493156<br />76244800 – 77229109',
        laPazEmail: 'contactos@publicidadvialimagen.com',
        laPazHours: 'Lunes - Viernes: 8:30am - 6:30pm<br />Sábados: 9:30am - 1:00pm<br />Domingos: Cerrado',
        // Santa Cruz
        santaCruz: 'Santa Cruz',
        santaCruzAddress: 'Avenida 2 de Agosto, Calle 6<br />(Entre 4 y 5 Anillo) N° 27<br />Santa Cruz, Bolivia',
        santaCruzPhones: '(591-3) 3494677<br />76244800 - 78988344',
        santaCruzEmail: 'comercial@publicidadvialimagen.com',
        santaCruzHours: 'Lunes - Viernes: 8:30am - 5:15pm<br />Sábados y Domingos: Cerrado',
        // Campos comunes
        location: 'Ubicación',
        phones: 'Teléfonos',
        email: 'Email',
        hours: 'Horarios',
        viewLocation: '📍 Ver ubicación'
      }
    },
    // Clients Section
    clients: {
      title: 'Confían en Nosotros',
      subtitle: 'Empresas líderes que han elegido nuestros espacios publicitarios para potenciar su marca',
      client: 'Cliente',
      stats: {
        billboards: 'Soportes Publicitarios',
        clients: 'Clientes',
        experience: 'Años de Experiencia'
      },
      award: {
        title: 'Ganador Premios Maya 2023',
        subtitle: 'A mejor empresa de publicidad vial'
      }
    },
    // Quote Request Page
    quoteRequest: {
      title: 'Solicitar Cotización',
      subtitle: 'Completa los datos para solicitar tu cotización',
      back: 'Volver',
      summary: {
        title: 'Resumen de tu Selección',
        description: 'Revisa los datos que seleccionaste en el producto',
        startDate: 'Fecha de Inicio:',
        rentalMonths: 'Meses de Alquiler:',
        months: 'meses',
        additionalServices: 'Servicios Adicionales:'
      },
      contact: {
        title: 'Datos de Contacto',
        description: 'Completa tus datos para procesar la solicitud',
        company: 'Empresa',
        companyPlaceholder: 'Nombre de tu empresa',
        name: 'Nombre',
        namePlaceholder: 'Tu nombre completo',
        phone: 'Teléfono',
        phonePlaceholder: '+591 2 1234567',
        email: 'Email',
        emailPlaceholder: 'tu@empresa.com',
        comments: 'Comentarios',
        commentsPlaceholder: 'Información adicional sobre tu solicitud...',
        submit: 'Solicitar Cotización',
        submitting: 'Enviando...'
      },
      success: {
        title: '¡Solicitud Enviada!',
        description: 'Tu solicitud de cotización ha sido enviada exitosamente. Nos pondremos en contacto contigo pronto.',
        backToHome: 'Volver al Inicio',
        viewMoreProducts: 'Ver Más Productos'
      }
    },
    // Account Section
    account: {
      title: 'Mi Cuenta',
      subtitle: 'Gestiona tu perfil y solicitudes',
      logout: 'Cerrar Sesión',
      tabs: {
        profile: 'Perfil',
        quotes: 'Cotizaciones',
        messages: 'Mensajes'
      },
      profile: {
        title: 'Información Personal',
        description: 'Actualiza tu información personal y cómo te mostramos',
        uploadPhoto: 'Subir foto',
        uploadPhotoComingSoon: 'Próximamente: Podrás subir tu foto de perfil',
        fullName: 'Nombre completo',
        fullNamePlaceholder: 'Tu nombre completo',
        email: 'Email',
        emailCannotChange: 'Tu email no se puede cambiar por seguridad',
        saveChanges: 'Guardar Cambios',
        profileUpdated: '¡Perfil actualizado!',
        profileUpdatedDesc: 'Tus datos han sido actualizados correctamente'
      },
      quotes: {
        title: 'Mis Cotizaciones',
        description: 'Solicitudes de cotización que has enviado',
        noQuotes: 'No tienes cotizaciones',
        noQuotesDesc: 'Explora nuestros soportes publicitarios disponibles',
        viewSupports: 'Ver Soportes',
        quoteNumber: 'Cotización',
        company: 'Empresa:',
        startDate: 'Fecha Inicio:',
        rentalMonths: 'Meses de Alquiler:',
        months: 'meses',
        additionalServices: 'Servicios Adicionales:',
        comments: 'Comentarios:',
        viewDetails: 'Ver Detalles',
        requestedOn: 'Solicitada el',
        rentalDuration: 'Duración del Alquiler',
        teamResponse: 'Respuesta del Equipo',
        respondedOn: 'Respondida el'
      },
      messages: {
        title: 'Mis Mensajes',
        description: 'Mensajes y respuestas recibidas',
        noMessages: 'No tienes mensajes',
        noMessagesDesc: 'Los mensajes y respuestas que recibas aparecerán aquí',
        unread: 'sin leer',
        new: 'Nuevo',
        responded: 'Respondido',
        from: 'De',
        message: 'Mensaje',
        response: 'Respuesta',
        receivedOn: 'Recibido el',
        respondedOn: 'Respondido el',
        viewFullMessage: 'Ver Mensaje Completo',
        deleteMessage: 'No se pudo eliminar el mensaje'
      }
    },
    // Cart Page
    cart: {
      title: 'Carrito de Compras',
      breadcrumb: 'Carrito',
      empty: {
        title: 'Tu carrito está vacío',
        description: 'Parece que aún no has añadido ningún producto a tu carrito.',
        explorePrinting: 'Explorar servicios de Impresión'
      },
      billboardRental: 'Alquiler de Vallas',
      printProducts: 'Productos de Impresión',
      selectedMonths: 'Meses seleccionados:',
      perMonth: '/mes',
      months: 'mes(es)',
      perM2: '/m²',
      additionalServices: 'Servicios adicionales:',
      moreBillboards: 'Más Vallas',
      moreProducts: 'Más Productos',
      emptyCart: 'Vaciar Carrito',
      orderSummary: 'Resumen del Pedido',
      billboardRentalSubtotal: 'Alquiler de vallas',
      printProductsSubtotal: 'Productos de impresión',
      subtotal: 'Subtotal',
      shipping: 'Envío',
      vat: 'IVA (21%)',
      total: 'Total',
      proceedToPayment: 'Proceder al Pago',
      discountCode: 'Código de descuento',
      apply: 'Aplicar',
      billboardActivation: 'Las vallas se activarán en las fechas seleccionadas',
      printDelivery: 'Productos de impresión: 2-5 días laborables'
    },
    // User Menu
    userMenu: {
      login: 'Iniciar Sesión',
      profile: 'Perfil',
      quotes: 'Cotizaciones',
      messages: 'Mensajes',
      logout: 'Cerrar Sesión'
    },
    // Footer
    footer: {
      description: 'Publicidad Vial Imagen - Espacios publicitarios premium en Bolivia',
      billboards: 'Vallas Publicitarias',
      company: 'Empresa',
      laPaz: 'La Paz',
      santaCruz: 'Santa Cruz',
      copyright: 'Todos los derechos reservados.',
      links: {
        privacy: 'Política de Privacidad',
        terms: 'Términos de Servicio',
        cookies: 'Política de Cookies',
        about: 'Nosotros',
        successCases: 'Casos de Éxito',
        deliveryInfo: 'Información de Entrega',
        contact: 'Contacto',
        blog: 'Blog'
      },
      social: {
        linkedin: 'LinkedIn',
        facebook: 'Facebook',
        instagram: 'Instagram'
      }
    }
  },
  en: {
    // Navigation
    nav: {
      home: 'Home',
      billboards: 'Billboards',
      printShop: 'Digital Printing',
      about: 'About Us',
      contact: 'Contact',
      search: 'Search...',
      cart: 'Cart',
      menu: 'Menu'
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      edit: 'Edit',
      delete: 'Delete',
      view: 'View',
      more: 'More',
      less: 'Less',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      continue: 'Continue',
      finish: 'Finish'
    },
    // Homepage
    home: {
      hero: {
        title: 'Premium Advertising Spaces',
        subtitle: 'Boost your brand with our strategically located billboards in the best locations in Bolivia',
        cta: 'View Available Billboards',
        ctaSecondary: 'Request Quote'
      },
      featuredBillboards: {
        title: 'Featured Advertising Spaces',
        quote: 'Quote',
        viewMore: 'View more'
      },
      whyOutdoor: {
        title: 'Why Outdoor Advertising?',
        subtitle: 'Measurable and proven results that boost your brand recognition.',
        reach: {
          title: 'Effective Reach',
          value: '97%',
          description: 'Outdoor advertising reaches 97% of adults in major cities.'
        },
        visibility: {
          title: 'Greater Visibility',
          value: '70%',
          description: '70% of people remember having seen a billboard in the last week.'
        },
        recall: {
          title: 'High Recall',
          value: '55%',
          description: '55% of consumers are more likely to remember brands in outdoor advertising.'
        },
        roi: {
          title: 'Superior ROI',
          value: '5x',
          description: 'The return on investment in outdoor advertising exceeds traditional media by 5 times.'
        }
      },
      features: {
        title: 'Why choose us?',
        strategic: {
          title: 'Strategic Locations',
          description: 'Our billboards are located in high-traffic vehicular and pedestrian points'
        },
        quality: {
          title: 'High Quality',
          description: 'Premium materials and professional finishes that guarantee durability'
        },
        coverage: {
          title: 'Wide Coverage',
          description: 'Presence in the main cities of Bolivia'
        },
        securePayment: {
          title: 'Secure Payment',
          description: 'Secure and reliable payment processes for your peace of mind'
        }
      }
    },
    // Billboards
    billboards: {
      title: 'Billboards',
      subtitle: 'Compare available supports in your city',
      search: 'Search location...',
      filter: 'Filter by',
      city: 'City',
      type: 'Billboard type',
      size: 'Size',
      price: 'Price',
      availability: 'Availability',
      viewDetails: 'View Details',
      requestQuote: 'Quote',
      addToCart: 'Add to Cart',
      categories: {
        unipolar: 'Single-Pole Billboard',
        bipolar: 'Two-Pole Billboard',
        tripolar: 'Three-Pole Billboard',
        mural: 'Building Mural Ad',
        megaValla: 'Large-Format Billboard',
        cartelera: 'Static Billboard',
        paleta: 'Advertising Totem'
      },
      // Billboards page
      page: {
        title: 'Billboards',
        subtitle: 'Compare available supports in your city',
        breadcrumb: 'Billboards',
        loadingMap: 'Loading map...',
        showMap: 'Show map',
        hideMap: 'Hide map',
        locationTitle: 'Advertising Spaces Location',
        filters: 'Filters',
        clearAll: 'Clear all',
        activeFilters: 'Active filters',
        noResults: 'No billboards found',
        noResultsDesc: 'Try adjusting your filters to find what you\'re looking for.',
        clearFilters: 'Clear all filters',
        sortBy: 'Sort by',
        featured: 'Featured',
        priceLow: 'Price: Low to High',
        priceHigh: 'Price: High to Low',
        newest: 'Newest',
        products: 'billboards',
        // Filters
        filters: 'Filters',
        clearAll: 'Clear all',
        availability: 'Availability',
        availableNow: 'Available now',
        comingSoon: 'Coming soon',
        sortBy: 'Sort by',
        popular: 'Popular',
        highestTraffic: 'Highest Traffic',
        alphabeticalAZ: 'Alphabetical A-Z',
        alphabeticalZA: 'Alphabetical Z-A',
        materialType: 'Material Type',
        recommendedUse: 'Recommended Use',
        durability: 'Durability',
        characteristics: 'Characteristics',
        // Billboard details
        dimensions: 'Dimensions',
        format: 'Format',
        monthlyPrice: 'Monthly price',
        city: 'City',
        location: 'Location',
        description: 'Description',
        features: 'Features',
        specifications: 'Specifications',
        // Buttons
        reserve: 'Reserve',
        addToCart: 'Add to Cart',
        back: 'Back',
        // States
        available: 'Available',
        reserved: 'Reserved',
        sold: 'Sold',
        // Product page
        backToSpaces: 'Back to spaces',
        spaceCharacteristics: 'Space characteristics',
        dimension: 'Dimension',
        supportType: 'Support type',
        dailyImpacts: 'Daily impacts',
        lighting: 'Lighting',
        quoteSpace: 'Quote space',
        startDate: 'Start date',
        selectDate: 'Select date',
        rentalMonths: 'Rental months',
        additionalServices: 'Additional services (paid upfront)',
        graphicDesign: 'Graphic design',
        bannerPrinting: 'Banner printing',
        billboardInstallation: 'Billboard installation',
        similarSupports: 'Other similar supports',
        requestQuote: 'Quote'
      }
    },
    // Print Shop
    printShop: {
      title: 'Digital Printing',
      subtitle: 'Our billboard advertising categories',
      services: {
        banners: 'Banners',
        posters: 'Posters',
        stickers: 'Stickers',
        businessCards: 'Business Cards',
        flyers: 'Flyers',
        exploreServices: 'Explore Services'
      },
      features: {
        durability: 'High durability materials',
        delivery: 'Guaranteed fast delivery',
        finishes: 'Professional finishes'
      },
      // Print page
      page: {
        title: 'Printing Services',
        subtitle: 'Professional printing materials calculated per square meter',
        breadcrumb: 'Printing',
        filters: 'Filters',
        clearAll: 'Clear all',
        materialType: 'Material Type',
        pricePerM2: 'Price per m² (€)',
        recommendedUse: 'Recommended Use',
        durability: 'Durability',
        characteristics: 'Characteristics',
        sortBy: 'Sort by',
        featured: 'Featured',
        priceLow: 'Price: Low to High',
        priceHigh: 'Price: High to Low',
        fastDelivery: 'Fastest delivery',
        noProducts: 'No products found',
        noProductsDesc: 'Try adjusting your filters to find what you\'re looking for.',
        clearFilters: 'Clear all filters',
        products: 'products',
        reserve: 'Reserve',
        // Maintenance mode
        comingSoon: 'Coming Soon',
        underConstruction: 'Page Under Construction',
        constructionDesc: 'We are working to bring you our digital printing services. Very soon you will be able to enjoy high-quality materials for your advertising projects.',
        calculationPerM2: 'Calculation per m²',
        calculationDesc: 'Transparent prices calculated exactly',
        highQuality: 'High Quality',
        qualityDesc: 'Professional and durable materials',
        fastDeliveryTitle: 'Fast Delivery',
        deliveryDesc: 'Optimized production times',
        backToHome: 'Back to Home'
      }
    },
    // About
    about: {
      title: 'About Us',
      subtitle: 'Learn more about Publicidad Vial Imagen',
      mission: 'Our Mission',
      vision: 'Our Vision',
      values: 'Our Values',
      // About page
      page: {
        breadcrumb: 'About us',
        ourStory: 'Our story',
        ourStoryDesc1: 'Publicidad Vial Imagen is a company with 36 years of experience in the advertising sector. We have outdoor advertising spaces to help our clients promote their brand, products and services.',
        ourStoryDesc2: 'We have the latest technology to provide our clients with high-impact and effective advertising in a fast and simple way.',
        ourStoryDesc3: 'We take advertising seriously, that\'s why we offer quality products and excellent customer service. Our team of professionals is here to help you with any questions or concerns. Don\'t hesitate to contact us if you want more information about how we can help you take your advertising to the next level!',
        ourCompany: 'Our company',
        ourCompanyDesc1: 'Publicidad Vial Imagen S.R.L. has been at the forefront of Bolivian advertising since 1989.',
        ourCompanyDesc2: 'Martín Sillerico, General Manager and founder, through several business lines has managed to position itself nationally with its wide range of products and services.',
        ourCompanyDesc3: 'We generate ideas, design them and implement them, developing and producing marketing concepts with value for our clients.',
        ourCompanyDesc4: 'We are a leading company in comprehensive advertising services at the national level, recognized for its technological capacity and human quality that contributes day by day to the economic development of the country.',
        generalManager: 'General Manager',
        ourValues: 'Our values',
        ourValuesDesc: 'At Publicidad Vial Imagen, our fundamental values guide everything we do, from space selection to customer service.',
        commitment: 'Commitment',
        commitmentDesc: 'We are committed to our clients\' success, offering effective and quality advertising solutions.',
        qualityGuaranteed: 'Guaranteed quality',
        qualityDesc: 'All our spaces and services meet the highest standards of quality and advertising effectiveness.',
        customerFocus: 'Customer focus',
        customerDesc: 'We are dedicated to providing exceptional service and building lasting relationships with our clients.',
        reliability: 'Reliability',
        reliabilityDesc: 'We keep our promises with fast delivery, precise installations and responsive customer support.',
        ourTeam: 'Our team',
        ourTeamDesc: 'Meet the team of professionals who make our success possible every day.',
        ourTeamText: 'At Publicidad Vial Imagen we have a multidisciplinary team of highly qualified professionals, committed to excellence and innovation. Each member of our team brings their experience and dedication to provide quality advertising solutions that exceed our clients\' expectations. We work together with passion and professionalism to make every advertising project a reality.'
      }
    },
    // Contact
    contact: {
      title: 'Contact',
      subtitle: 'Get in touch with us',
      quote: {
        title: 'Ready to boost your brand?',
        titleHighlight: 'boost',
        subtitle: 'Request a free consultation and discover how outdoor advertising can transform your brand reach.',
        benefits: {
          consultation: 'Initial consultation at no cost',
          proposal: 'Personalized proposal in less than 24h',
          prices: 'Competitive and flexible prices'
        },
        formTitle: 'Request your quote',
        privacy: 'By submitting this form, you agree to our privacy policy.',
        send: 'Send Request'
      },
      form: {
        name: 'Full name',
        namePlaceholder: 'Your name',
        email: 'Email',
        emailPlaceholder: 'your@email.com',
        phone: 'Phone',
        phonePlaceholder: '+591 2 1234-5678',
        company: 'Company',
        companyPlaceholder: 'Your company name',
        message: 'Message (optional)',
        messagePlaceholder: 'Tell us more about your project...',
        send: 'Send Message'
      },
      info: {
        address: 'Address',
        phone: 'Phone',
        email: 'Email',
        hours: 'Business Hours'
      },
      // Contact page
      page: {
        title: 'Contact',
        subtitle: 'Do you have any questions? We\'d love to hear from you. Send us a message and we\'ll get back to you as soon as possible.',
        sendMessage: 'Send us a Message',
        thanks: 'Thank you!',
        thanksDesc: 'Your message has been sent successfully. We will get back to you as soon as possible.',
        namePlaceholder: 'Your name',
        emailPlaceholder: 'your@email.com',
        phonePlaceholder: 'Your phone',
        companyPlaceholder: 'Your company',
        messagePlaceholder: 'Write your message here (max. 500 characters)',
        sending: 'Sending...',
        sendMessageBtn: 'Send Message',
        followUs: 'Follow us on Social Media',
        branches: 'Branches',
        branchLocation: 'Location of Our Branches',
        // La Paz
        laPaz: 'La Paz',
        laPazAddress: 'C. Nicolás Acosta Esq. Pedro Blanco<br />(Alto San Pedro) N° 1471<br />La Paz, Bolivia',
        laPazPhones: '(591-2) 2493155 – 2493156<br />76244800 – 77229109',
        laPazEmail: 'contactos@publicidadvialimagen.com',
        laPazHours: 'Monday - Friday: 8:30am - 6:30pm<br />Saturdays: 9:30am - 1:00pm<br />Sundays: Closed',
        // Santa Cruz
        santaCruz: 'Santa Cruz',
        santaCruzAddress: 'Avenida 2 de Agosto, Calle 6<br />(Entre 4 y 5 Anillo) N° 27<br />Santa Cruz, Bolivia',
        santaCruzPhones: '(591-3) 3494677<br />76244800 - 78988344',
        santaCruzEmail: 'comercial@publicidadvialimagen.com',
        santaCruzHours: 'Monday - Friday: 8:30am - 5:15pm<br />Saturdays and Sundays: Closed',
        // Common fields
        location: 'Location',
        phones: 'Phones',
        email: 'Email',
        hours: 'Hours',
        viewLocation: '📍 View location'
      }
    },
    // Clients Section
    clients: {
      title: 'They Trust Us',
      subtitle: 'Leading companies that have chosen our advertising spaces to boost their brand',
      client: 'Client',
      stats: {
        billboards: 'Advertising Spaces',
        clients: 'Clients',
        experience: 'Years of Experience'
      },
      award: {
        title: 'Maya Awards 2023 Winner',
        subtitle: 'Best outdoor advertising company'
      }
    },
    // Quote Request Page
    quoteRequest: {
      title: 'Request Quote',
      subtitle: 'Complete the information to request your quote',
      back: 'Back',
      summary: {
        title: 'Summary of your Selection',
        description: 'Review the data you selected in the product',
        startDate: 'Start Date:',
        rentalMonths: 'Rental Months:',
        months: 'months',
        additionalServices: 'Additional Services:'
      },
      contact: {
        title: 'Contact Information',
        description: 'Complete your information to process the request',
        company: 'Company',
        companyPlaceholder: 'Your company name',
        name: 'Name',
        namePlaceholder: 'Your full name',
        phone: 'Phone',
        phonePlaceholder: '+591 2 1234567',
        email: 'Email',
        emailPlaceholder: 'your@company.com',
        comments: 'Comments',
        commentsPlaceholder: 'Additional information about your request...',
        submit: 'Request Quote',
        submitting: 'Sending...'
      },
      success: {
        title: 'Request Sent!',
        description: 'Your quote request has been sent successfully. We will contact you soon.',
        backToHome: 'Back to Home',
        viewMoreProducts: 'View More Products'
      }
    },
    // Account Section
    account: {
      title: 'My Account',
      subtitle: 'Manage your profile and requests',
      logout: 'Log Out',
      tabs: {
        profile: 'Profile',
        quotes: 'Quotes',
        messages: 'Messages'
      },
      profile: {
        title: 'Personal Information',
        description: 'Update your personal information and how we display you',
        uploadPhoto: 'Upload photo',
        uploadPhotoComingSoon: 'Coming soon: You will be able to upload your profile photo',
        fullName: 'Full name',
        fullNamePlaceholder: 'Your full name',
        email: 'Email',
        emailCannotChange: 'Your email cannot be changed for security reasons',
        saveChanges: 'Save Changes',
        profileUpdated: 'Profile updated!',
        profileUpdatedDesc: 'Your data has been updated successfully'
      },
      quotes: {
        title: 'My Quotes',
        description: 'Quote requests you have sent',
        noQuotes: 'You have no quotes',
        noQuotesDesc: 'Explore our available advertising spaces',
        viewSupports: 'View Spaces',
        quoteNumber: 'Quote',
        company: 'Company:',
        startDate: 'Start Date:',
        rentalMonths: 'Rental Months:',
        months: 'months',
        additionalServices: 'Additional Services:',
        comments: 'Comments:',
        viewDetails: 'View Details',
        requestedOn: 'Requested on',
        rentalDuration: 'Rental Duration',
        teamResponse: 'Team Response',
        respondedOn: 'Responded on'
      },
      messages: {
        title: 'My Messages',
        description: 'Messages and responses received',
        noMessages: 'You have no messages',
        noMessagesDesc: 'Messages and responses you receive will appear here',
        unread: 'unread',
        new: 'New',
        responded: 'Responded',
        from: 'From',
        message: 'Message',
        response: 'Response',
        receivedOn: 'Received on',
        respondedOn: 'Responded on',
        viewFullMessage: 'View Full Message',
        deleteMessage: 'Could not delete message'
      }
    },
    // Cart Page
    cart: {
      title: 'Shopping Cart',
      breadcrumb: 'Cart',
      empty: {
        title: 'Your cart is empty',
        description: 'It seems you haven\'t added any products to your cart yet.',
        explorePrinting: 'Explore Printing Services'
      },
      billboardRental: 'Billboard Rental',
      printProducts: 'Print Products',
      selectedMonths: 'Selected months:',
      perMonth: '/month',
      months: 'month(s)',
      perM2: '/m²',
      additionalServices: 'Additional services:',
      moreBillboards: 'More Billboards',
      moreProducts: 'More Products',
      emptyCart: 'Empty Cart',
      orderSummary: 'Order Summary',
      billboardRentalSubtotal: 'Billboard rental',
      printProductsSubtotal: 'Print products',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      vat: 'VAT (21%)',
      total: 'Total',
      proceedToPayment: 'Proceed to Payment',
      discountCode: 'Discount code',
      apply: 'Apply',
      billboardActivation: 'Billboards will be activated on selected dates',
      printDelivery: 'Print products: 2-5 business days'
    },
    // User Menu
    userMenu: {
      login: 'Log In',
      profile: 'Profile',
      quotes: 'Quotes',
      messages: 'Messages',
      logout: 'Log Out'
    },
    // Footer
    footer: {
      description: 'Publicidad Vial Imagen - Premium advertising spaces in Bolivia',
      billboards: 'Billboards',
      company: 'Company',
      laPaz: 'La Paz',
      santaCruz: 'Santa Cruz',
      copyright: 'All rights reserved.',
      links: {
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        cookies: 'Cookie Policy',
        about: 'About Us',
        successCases: 'Success Cases',
        deliveryInfo: 'Delivery Information',
        contact: 'Contact',
        blog: 'Blog'
      },
      social: {
        linkedin: 'LinkedIn',
        facebook: 'Facebook',
        instagram: 'Instagram'
      }
    }
  }
} as const;

export type TranslationKeys = typeof translations.es;

export function getTranslation(locale: Locale, key: string): string {
  try {
    const keys = key.split('.');
    let value: any = translations[locale] || translations.es; // Fallback a español si el locale no existe
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Si no se encuentra, intentar con el locale por defecto
        if (locale !== 'es') {
          value = translations.es;
          for (const k2 of keys) {
            if (value && typeof value === 'object' && k2 in value) {
              value = value[k2];
            } else {
              return key;
            }
          }
          return typeof value === 'string' ? value : key;
        }
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  } catch (error) {
    console.warn(`Translation error for key "${key}" with locale "${locale}":`, error);
    return key;
  }
}
