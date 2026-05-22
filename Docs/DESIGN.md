# Семантическая Дизайн-Система (DESIGN.md)

## Палитра
- **Background**: `#111821` (Тёмный космический)
- **Primary**: `#1978e5` (Яркий синий)
- **Secondary**: `#135bec` (Глубокий синий)
- **Success**: `#4ade80` (Зеленый неон)
- **Error/Removed**: `#f87171` (Коралловый красный)
- **Warning/Changed**: `#60a5fa` (Небесно-голубой)
- **Muted**: `#94a3b8` (Стальной серый)

## Типографика
- **Sans**: Segoe UI, Tahoma, sans-serif.
- **Mono**: JetBrains Mono (для терминала и счетчиков).

## Эффекты
- **Glassmorphism**: 
  - `backdrop-filter: blur(12px)`
  - `border: 1px solid rgba(255, 255, 255, 0.1)`
- **Glow**: Subtle shadows with primary color.
- **Scanlines**: Анимированные полосы сканирования (`.scan-overlay`, `.scan-beam`).

## Анимации
- `heartbeat`: Для важных индикаторов.
- `shake`: Для ховер-эффектов реакций.
- `cp-in`: Плавное появление оверлея.
