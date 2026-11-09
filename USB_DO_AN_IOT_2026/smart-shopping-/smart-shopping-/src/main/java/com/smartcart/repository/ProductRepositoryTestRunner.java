package com.smartcart.repository;

import java.util.List;

import org.springframework.boot.CommandLineRunner;


import com.smartcart.model.Product;


public class ProductRepositoryTestRunner implements CommandLineRunner {

    private final ProductRepository productRepository;

    public ProductRepositoryTestRunner(
            ProductRepository productRepository) {

        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {

        System.out.println();
        System.out.println("======================================");
        System.out.println("TEST DOC DANH SACH SAN PHAM");
        System.out.println("======================================");

        List<Product> products = productRepository.findAll();

        System.out.println(
                "So luong san pham: " + products.size()
        );

        for (Product product : products) {

            System.out.println(
                    product.getId()
                    + " | "
                    + product.getName()
                    + " | "
                    + product.getCategory()
                    + " | "
                    + product.getPrice()
                    + " | Ke "
                    + product.getShelfId()
                    + " | ("
                    + product.getXCoord()
                    + ", "
                    + product.getYCoord()
                    + ") | "
                    + product.getQrCode()
            );
        }

        System.out.println("======================================");
        System.out.println();
    }
}