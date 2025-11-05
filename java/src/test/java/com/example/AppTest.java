package com.example;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

public class AppTest {
    @Test
    void greetWithName() {
        assertEquals("Hello, Alice!", App.greet("Alice"));
    }

    @Test
    void greetNullOrBlank() {
        assertEquals("Hello, world!", App.greet(null));
        assertEquals("Hello, world!", App.greet(""));
    }
}

