# create-java-module-create-only.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$moduleDir = Join-Path (Get-Location) 'java'
$junitVersion = '5.10.0'

# Create directories
New-Item -ItemType Directory -Force -Path (Join-Path $moduleDir 'src\main\java\com\example') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $moduleDir 'src\test\java\com\example') | Out-Null

# pom.xml
$pomPath = Join-Path $moduleDir 'pom.xml'
$pomContent = @"
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
                             http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.example</groupId>
  <artifactId>appmat-sample</artifactId>
  <version>0.1.0-SNAPSHOT</version>
  <packaging>jar</packaging>

  <properties>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
    <java.version>21</java.version>
    <junit.version>$junitVersion</junit.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter-api</artifactId>
      <version>\${junit.version}</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter-engine</artifactId>
      <version>\${junit.version}</version>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.11.0</version>
        <configuration>
          <release>21</release>
        </configuration>
      </plugin>

      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-surefire-plugin</artifactId>
        <version>3.1.2</version>
      </plugin>
    </plugins>
  </build>
</project>
"@
$pomContent | Out-File -FilePath $pomPath -Encoding UTF8

# App.java
$appPath = Join-Path $moduleDir 'src\main\java\com\example\App.java'
$appContent = @"
package com.example;

public class App {
    public static String greet(String name) {
        if (name == null || name.isBlank()) return \"Hello, world!\";
        return \"Hello, \" + name + \"!\";
    }

    public static void main(String[] args) {
        System.out.println(greet(args.length > 0 ? args[0] : null));
    }
}
"@
$appContent | Out-File -FilePath $appPath -Encoding UTF8

# AppTest.java
$testPath = Join-Path $moduleDir 'src\test\java\com\example\AppTest.java'
$testContent = @"
package com.example;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class AppTest {
    @Test
    void greetWithName() {
        assertEquals(\"Hello, Alice!\", App.greet(\"Alice\"));
    }

    @Test
    void greetNullOrBlank() {
        assertEquals(\"Hello, world!\", App.greet(null));
        assertEquals(\"Hello, world!\", App.greet(\"\"));
    }
}
"@
$testContent | Out-File -FilePath $testPath -Encoding UTF8

# README-java.md
$readmePath = Join-Path $moduleDir 'README-java.md'
$readmeContent = @"
# Java 21 sample module

This folder contains a minimal Maven Java module configured to target Java 21.

Prerequisites
- Java 21 JDK installed and `JAVA_HOME` set (Temurin / OpenJDK).
- Maven 3.8+ installed.

Quick setup (PowerShell)
```powershell
# from repo root
mvn -f [pom.xml](http://_vscodecontentref_/1) -B -U clean verify
# or to install locally
mvn -f [pom.xml](http://_vscodecontentref_/2) -B -U clean install