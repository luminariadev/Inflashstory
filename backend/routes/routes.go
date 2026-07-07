package routes

import (
	"inventory-api/controllers"
	"inventory-api/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// ==================== PUBLIC ROUTES (Tanpa Auth) ====================
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
		r.GET("/api/items/:id/bookings", controllers.GetItemBookings)

		// ✅ FITUR BARU: Cek Status Peminjaman Mahasiswa (Public)
		api.GET("/transactions/status", controllers.GetTransactionsByNIM)

		// ✅ FST INTEGRATION: Endpoint Upload File (Surat & KTP)
		api.POST("/upload", middleware.UploadRateLimit(), controllers.UploadDocument)

		// Stats (public - untuk info website)
		api.GET("/stats", controllers.GetStats)

		// ✅ LOGIN endpoint (PUBLIC - tidak perlu auth)
		api.POST("/admin/login", controllers.LoginAdmin)
	}

	// ==================== USER ROUTES (Perlu Autentikasi User) ====================
	userGroup := r.Group("/api/user")
	userGroup.Use(middleware.UserAuth())
	{
		userGroup.DELETE("/bookings/:id/cancel", controllers.CancelBooking)
	}

	// ==================== ADMIN ROUTES (Perlu Autentikasi) ====================
	admin := r.Group("/api/admin")
	admin.Use(middleware.AdminAuth())
	{
		// Profile
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
		admin.POST("/transactions/:id/approve", middleware.RequireSuperAdmin(), controllers.ApproveTransaction) // ✅ SUPER ADMIN ONLY

		// Borrowers
		admin.GET("/borrowers", controllers.GetBorrowers)
		admin.GET("/borrowers/:id", controllers.GetBorrower)

		// Bookings management (fitur lanjutan)
		admin.GET("/bookings", controllers.GetBookings)
		admin.PUT("/bookings/:id/approve", middleware.RequireSuperAdmin(), controllers.ApproveBooking) // ✅ SUPER ADMIN ONLY
		admin.GET("/bookings/check-expired", controllers.CheckExpiredBookings)

		// Stats detail
		admin.GET("/stats/detail", controllers.GetStats)
	}

	// Health check (public)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
}
