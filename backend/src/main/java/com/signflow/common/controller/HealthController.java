package com.signflow.common.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/api/v1/health")
    public Map<String, Object> health() {

        return Map.of(
                "application", "SignFlow",
                "status", "UP",
                "version", "1.0.0",
                "timestamp", Instant.now().toString()
        );

    }

}