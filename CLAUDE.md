@AGENTS.md

# ProjectG — PrepList Pro

## Qué es este proyecto
SaaS de gestión de producción de cocina profesional. Permite a los jefes de partida gestionar el stock diario, registrar producciones y controlar caducidades en tiempo real.

## Stack
- Next.js 16.2.1 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Realtime)
- Despliegue en Vercel

## Dispositivo objetivo
Tablet de 10" montada en cocina profesional. La UI debe estar optimizada para:
- Dedos con guantes o húmedos — botones mínimo 48px de alto
- Lectura rápida a distancia — texto mínimo 16px, títulos 20px+
- Uso con una mano — acciones principales siempre visibles sin scroll
- Ambiente con grasa y vapor — alto contraste, sin elementos frágiles

## Diseño
- Layout: sidebar fijo a la izquierda con navegación, contenido principal a la derecha
- Tipografía: DM Sans (Google Fonts) — legible, moderna, no genérica
- Colores semáforo: verde #16a34a, amarillo #ca8a04, rojo #dc2626
- Fondo general: #f8f7f4 (blanco cálido, no puro)
- Tarjetas: fondo blanco #ffffff, borde #e5e3de, border-radius 12px
- Sin sombras decorativas — solo bordes sutiles
- Partidas con color de acento: Fríos → azul, Fuegos → naranja, Postres → rosa

## Base de datos (Supabase)
- restaurant_id de prueba: 11111111-1111-1111-1111-111111111111
- Vista principal: stock_actual_hoy (devuelve stock, par, falta_producir, proxima_caducidad)
- Tabla de logs: production_logs (type: 'opening' | 'production')

## Convenciones de código
- Server Components por defecto, Client Components solo cuando hay interactividad
- Acciones de escritura en Supabase desde Client Components con 'use client'
- Carpeta de componentes: src/components/
- Estilos con Tailwind — sin CSS modules ni styled-components
- Sin librerías de UI externas (no shadcn, no MUI) — componentes propios

## Lo que NO hacer
- No usar Inter, Roboto ni Arial
- No usar sombras box-shadow decorativas
- No hacer botones menores de 48px de alto
- No poner información crítica en tooltips (invisible en tablet)
- No usar modales — usar paneles inline expansibles
