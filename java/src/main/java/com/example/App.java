$path = Join-Path $PWD 'java\src\main\java\com\example\App.java'

@'
package com.example;

public class App {
    public static String greet(String name) {
        if (name == null || name.isBlank()) return "Hello, world!";
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        System.out.println(greet(args.length > 0 ? args[0] : null));
    }
}
'@ | Out-File -FilePath $path -Encoding UTF8

Write-Host "Wrote corrected file to: $path"