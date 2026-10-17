package com.lockedin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LockedInApplication {
    public static void main(String[] args) {
        SpringApplication.run(LockedInApplication.class, args);
    }
}
