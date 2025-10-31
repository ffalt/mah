import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

android {
    compileSdk = 36
    namespace = "io.github.ffalt.mah"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "io.github.ffalt.mah"
        minSdk = 24
        targetSdk = 36
        versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
        versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
    }

    signingConfigs {
        named("debug") {
           keyAlias = "androiddebugkey"
           keyPassword = "android"
           storeFile = file("debug.keystore")
           storePassword = "android"
        }
        create("release") {
            val keystorePropertiesFile = rootProject.file("keystore.properties")
            val keystoreProperties = Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(FileInputStream(keystorePropertiesFile))
            }
    
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["password"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }

    buildTypes {
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            signingConfig = signingConfigs.getByName("debug")
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {                
                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        getByName("release") {
            isMinifyEnabled = true
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                *fileTree(".") { include("**/*.pro") }
                    .plus(getDefaultProguardFile("proguard-android-optimize.txt"))
                    .toList().toTypedArray()
            )
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
    }
    
    applicationVariants.all {
        val appName = "android-mah"
        val vName = mergedFlavor.versionName ?: "0.0.0"
        val versionSafe = vName.replace('.', '_')

        if (buildType.name == "release") {
            // Rename APK outputs (release only)
            this.outputs
                .map { it as com.android.build.gradle.internal.api.ApkVariantOutputImpl }
                .forEach { output ->
                    val fileExtension = output.outputFileName.substringAfterLast('.', "")
                    val variantName = output.outputFile?.parentFile?.parentFile?.name
                    val apkName = "${appName}-${versionSafe}-${variantName}.${fileExtension}"
                    output.outputFileName = apkName
                }

            // Rename AAB (App Bundle) output to match the APK naming scheme (release only)
            val variantName = name
            val capitalizedVariant = variantName.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
            val bundleTaskName = "bundle${capitalizedVariant}"

            tasks.named(bundleTaskName).configure {
                doLast {
                    val bundleDir = file("${buildDir}/outputs/bundle/${variantName}")
                    if (bundleDir.exists()) {
                        val from = bundleDir.listFiles { _, s -> s.endsWith(".aab") }?.firstOrNull()
                        if (from != null) {
                            val to = file("${bundleDir}/${appName}-${versionSafe}-universal.aab")
                            if (from.name != to.name) {
                                from.renameTo(to)
                            }
                        }
                    }
                }
            }
        }
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("com.google.android.material:material:1.12.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = "tauri.build.gradle.kts")