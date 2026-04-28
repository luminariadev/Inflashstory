package routes

import (
	"inventory-api/controllers"
	"inventory-api/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// Public routes (tanpa auth)
	api := r.Group("/api")
	{
		// Item routes (public - lihat barang)
		api.GET("/items", controllers.GetItems)
		api.GET("/items/:id", controllers.GetItem)
		api.GET("/items/:id/qr", controllers.GetQR)
		api.GET("/items/:id/qr-info", controllers.GetQRInfo)

		// Borrow routes (public - scan QR & submit form) - OTOMATIS
		api.POST("/borrow/:id", controllers.BorrowItem)

		// Booking routes (public - fitur lanjutan)
		api.POST("/bookings", controllers.CreateBooking)
		api.DELETE("/bookings/:id/cancel", controllers.CancelBooking)

		// Stats (public - untuk info website)
		api.GET("/stats", controllers.GetStats)

		// Health check
		r.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status": "ok",
			})
		})
	}

	// Admin routes (perlu autentikasi)
	admin := r.Group("/api/admin")
	admin.Use(middleware.AdminAuth())
	{
		// Auth
		admin.POST("/login", controllers.LoginAdmin)
		admin.GET("/profile", controllers.GetAdminProfile)

		// Item management
		admin.POST("/items", controllers.CreateItem)
		admin.PUT("/items/:id", controllers.UpdateItem)
		admin.DELETE("/items/:id", controllers.DeleteItem)
		admin.PATCH("/items/:id/status", controllers.UpdateItemStatus)

		// Manual borrow (BACKUP)
		admin.POST("/borrow/manual", controllers.ManualBorrowItem)

		// Return
		admin.POST("/return/:id", controllers.ReturnItem)

		// Transactions
		admin.GET("/transactions", controllers.GetTransactions)
		admin.GET("/transactions/active", controllers.GetActiveTransactions)
		admin.GET("/transactions/:id", controllers.GetTransactionByID)
		admin.GET("/transactions/overdue", controllers.GetOverdueTransactions)

		// Borrowers
		admin.GET("/borrowers", controllers.GetBorrowers)
		admin.GET("/borrowers/:id", controllers.GetBorrower)

		// Bookings management (fitur lanjutan)
		admin.GET("/bookings", controllers.GetBookings)
		admin.PUT("/bookings/:id/approve", controllers.ApproveBooking)
		admin.GET("/bookings/check-expired", controllers.CheckExpiredBookings)

		// Stats detail
		admin.GET("/stats/detail", controllers.GetStats)
	}
}
