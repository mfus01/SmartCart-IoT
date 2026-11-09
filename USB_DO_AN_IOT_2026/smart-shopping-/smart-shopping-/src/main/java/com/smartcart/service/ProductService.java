package com.smartcart.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.smartcart.model.Product;
import com.smartcart.repository.ProductRepository;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> searchProducts(String keyword) {
        return productRepository.findByName(keyword);
    }

    public Product getProductById(String id) {
        return productRepository.findById(id);
    }
    public Product getProductByQrCode(String qrCode) {
        return productRepository.findByQrCode(qrCode);
    }

    public boolean addProduct(Product product) {
        return productRepository.save(product);
    }

    public boolean updateProduct(Product product) {
        return productRepository.update(product);
    }
    public boolean deleteProduct(String id) {
        return productRepository.deleteById(id);
    }
    public void debugDatabase() {
        productRepository.debugDatabase();
    }
}