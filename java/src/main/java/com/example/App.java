package com.example;

/**
 * Minimal sample app for tests.
 */
public class App {

    /**
     * Returns greeting. If name is null or empty, returns "Hello, world!".
     */
    public static String greet(String name) {
        if (name == null || name.isEmpty()) {
            return "Hello, world!";
        }
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        String name = (args != null && args.length > 0) ? args[0] : "world";
        System.out.println(greet(name));
    }
}
