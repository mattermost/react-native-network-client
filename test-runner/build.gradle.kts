plugins {
    kotlin("jvm") version "1.9.22"
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.11.0")
    testImplementation("com.squareup.okhttp3:mockwebserver:4.12.0")
}

sourceSets {
    main {
        kotlin {
            // Production sources free of Android dependencies, compiled and tested as-is.
            srcDir("../android/src/main/java")
            include(
                "com/mattermost/networkclient/interceptors/BearerTokenInterceptor.kt",
                "com/mattermost/networkclient/interceptors/TokenStore.kt",
            )
        }
    }
    test {
        kotlin {
            srcDir("src/test/kotlin")
        }
    }
}
