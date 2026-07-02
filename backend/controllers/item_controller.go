package controllers

import (
	"net/http"
	"strconv"

	"inventory-api/models"
	"inventory-api/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetItems - Get all items with filters
func GetItems(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var items []models.Item

	status := c.Query("status")
	category := c.Query("category")
	search := c.Query("search")

	query := db
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if category != "" {
		query = query.Where("category = ?", category)
	}
	if search != "" {
		query = query.Where("name LIKE ? OR code LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	var total int64
	query.Model(&models.Item{}).Count(&total)
	query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&items)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   items,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// ItemRequest - DTO for Create and Update Item
type ItemRequest struct {
	Name          string `json:"name" binding:"required"`
	Code          string `json:"code"`
	Category      string `json:"category"`
	CategoryType  string `json:"category_type"` // ✅ Pastikan ada di DTO
	Location      string `json:"location"`
	Description   string `json:"description"`
	Status        string `json:"status"`
	Condition     string `json:"condition"`
	RequiredID    string `json:"required_id"`
	RequireLetter bool   `json:"require_letter"`
	ImageURL      string `json:"image_url"`
	TotalStock    int    `json:"total_stock"`
}

// GetItem - Get single item
func GetItem(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var item models.Item
	if err := db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Item tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   item,
	})
}

// CreateItem - Create new item (admin only)
func CreateItem(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	var req ItemRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// ✅ Explicit Mapping to models.Item
	item := models.Item{
		Name:          req.Name,
		Code:          req.Code,
		Category:      req.Category,
		CategoryType:  req.CategoryType,
		Location:      req.Location,
		Description:   req.Description,
		Status:        req.Status,
		Condition:     req.Condition,
		RequiredID:    req.RequiredID,
		RequireLetter: req.RequireLetter,
		ImageURL:      req.ImageURL,
		TotalStock:    req.TotalStock,
	}

	if item.Code == "" {
		var count int64
		db.Model(&models.Item{}).Count(&count)
		item.Code = utils.GenerateItemCode(int(count) + 1)
	}
	if item.Status == "" {
		item.Status = "available"
	}
	if item.Condition == "" {
		item.Condition = "good"
	}
	if item.CategoryType == "" {
		item.CategoryType = "Barang" // default
	}

	// ✅ BARU: Set default stok ke 1 kalau Admin masukin 0 atau lupa ngisi
	if item.TotalStock <= 0 {
		item.TotalStock = 1
	}

	// ImageURL sudah otomatis terisi dari JSON mapping

	if err := db.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal membuat item: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status": "success",
		"data":   item,
	})
}

// UpdateItem - Update item
func UpdateItem(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var item models.Item
	if err := db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Item tidak ditemukan",
		})
		return
	}

	var req ItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// ✅ Explicit mapping dari DTO
	updates := map[string]interface{}{
		"name":           req.Name,
		"code":           req.Code,
		"category":       req.Category,
		"category_type":  req.CategoryType,
		"location":       req.Location,
		"description":    req.Description,
		"status":         req.Status,
		"condition":      req.Condition,
		"required_id":    req.RequiredID,
		"require_letter": req.RequireLetter,
		"image_url":      req.ImageURL,
		"total_stock":    req.TotalStock,
	}

	// Update fields (menggunakan map memastikan zero-value update jika diperlukan)
	db.Model(&item).Updates(updates)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   item,
	})
}

// UpdateItemStatus - Update item status
func UpdateItemStatus(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var item models.Item
	if err := db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Item tidak ditemukan",
		})
		return
	}

	var req models.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	validStatuses := map[string]bool{
		"available": true, "borrowed": true, "reserved": true,
		"damaged": true, "maintenance": true, "lost": true,
	}
	if !validStatuses[req.Status] {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Status tidak valid",
		})
		return
	}

	updates := map[string]interface{}{
		"status": req.Status,
	}
	if req.Condition != "" {
		validConditions := map[string]bool{"good": true, "fair": true, "damaged": true}
		if validConditions[req.Condition] {
			updates["condition"] = req.Condition
		}
	}

	db.Model(&item).Updates(updates)

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   item,
	})
}

// DeleteItem - Soft delete item
func DeleteItem(c *gin.Context) {
	db := c.MustGet("db").(*gorm.DB)
	id := c.Param("id")

	var activeTransaction models.Transaction
	if db.Where("item_id = ? AND status = ?", id, "borrowed").First(&activeTransaction).Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Tidak dapat menghapus barang yang sedang dipinjam",
		})
		return
	}

	result := db.Delete(&models.Item{}, id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal menghapus item",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Item tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Item berhasil dihapus",
	})
}
