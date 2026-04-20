'use client'

import { useRef, useEffect, useState } from 'react'
import { ZoomIn, ZoomOut, Move } from 'lucide-react'

export function ERDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
    script.async = true
    script.onload = () => {
      window.mermaid.initialize({ startOnLoad: true, theme: 'base' })
      window.mermaid.contentLoaded()
    }
    document.body.appendChild(script)
  }, [])

  const handleZoom = (direction: 'in' | 'out') => {
    setScale((s) => {
      const newScale = direction === 'in' ? s * 1.2 : s / 1.2
      return Math.max(0.5, Math.min(3, newScale))
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetView = () => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => handleZoom('in')}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="size-4" />
          Zoom in
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="size-4" />
          Zoom out
        </button>
        <button
          onClick={resetView}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
          title="Reset view"
        >
          <Move className="size-4" />
          Reset
        </button>
      </div>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="overflow-auto border rounded-lg bg-muted/30 p-4 cursor-grab active:cursor-grabbing"
        style={{ height: '600px' }}
      >
        <div
          style={{
            transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
            transformOrigin: 'top left',
            transition: isDragging ? 'none' : 'transform 0.2s',
          }}
        >
          <div className="mermaid">
            {`erDiagram
    Category {
        String id PK
        String name
        Boolean available
        Int position
        String image
        String printerId FK
    }
    Ingredient {
        String id PK
        String name
    }
    Food {
        String id PK
        String name
        String description
        Decimal price
        Boolean available
        String categoryId FK
        String printerId FK
    }
    FoodIngredient {
        String foodId FK
        String ingredientId FK
    }
    Order {
        Int id PK
        String displayCode
        String table
        String customer
        DateTime createdAt
        DateTime confirmedAt
        Int ticketNumber
        OrderStatus status
        PaymentMethod paymentMethod
        Decimal subTotal
        Decimal discount
        Decimal surcharge
        Decimal total
        String userId FK
        String cashRegisterId FK
    }
    OrderItem {
        String id PK
        Int quantity
        Int orderId FK
        String foodId FK
        Decimal unitPrice
        Decimal unitSurcharge
        Decimal total
        String notes
    }
    Role {
        String id PK
        String name
    }
    User {
        String id PK
        String username
        String password
        String roleId FK
    }
    RefreshToken {
        String id PK
        String token
        String userId FK
        DateTime createdAt
        DateTime expiresAt
        DateTime revokedAt
        String ip
        String userAgent
    }
    Printer {
        String id PK
        String name
        String ip
        String mac
        Int port
        String description
        PrinterStatus status
    }
    CashRegister {
        String id PK
        String name
        Boolean enabled
        String defaultPrinterId FK
    }
    ApiKey {
        String id PK
        String hash_key
        String prefix
        String last_digits
        ApiKeyType type
        String name
        DateTime createdAt
        DateTime lastUsedAt
        DateTime revokedAt
    }
    Banner {
        String id PK
        String name
        BannerType type
        String title
        String description
        String website
        String instagram
        String facebook
        String image
        String color
        DateTime dateTime
    }
    OrderInstruction {
        String id PK
        String text
        Int position
    }
    Report {
        String id PK
        DateTime timestamp
        Int intervalInMinutes
        Decimal totalRevenue
        Decimal totalCashRevenue
        Decimal totalCardRevenue
        Int totalOrders
        Int averageCompletitionTime
    }
    CategoryStats {
        String id PK
        String categoryId FK
        String reportId FK
        Int itemsSold
        Decimal revenue
    }
    FoodStats {
        String id PK
        String foodId FK
        String reportId FK
        Int itemsSold
        Decimal revenue
    }
    UserStats {
        String id PK
        String userId FK
        String reportId FK
        Int ordersProcessed
        Decimal totalHandled
    }

    Category }o--o| Printer : "printerId"
    Food }o--|| Category : "categoryId"
    Food }o--o| Printer : "printerId"
    FoodIngredient }|--|| Food : "foodId"
    FoodIngredient }|--|| Ingredient : "ingredientId"
    Order }o--o| User : "userId"
    Order }o--o| CashRegister : "cashRegisterId"
    OrderItem }|--|| Order : "orderId"
    OrderItem }|--|| Food : "foodId"
    User }|--|| Role : "roleId"
    RefreshToken }|--|| User : "userId"
    CashRegister }o--o| Printer : "defaultPrinterId"
    CategoryStats }|--|| Category : "categoryId"
    CategoryStats }|--|| Report : "reportId"
    FoodStats }|--|| Food : "foodId"
    FoodStats }|--|| Report : "reportId"
    UserStats }|--|| User : "userId"
    UserStats }|--|| Report : "reportId"`}
          </div>
        </div>
      </div>
    </div>
  )
}
