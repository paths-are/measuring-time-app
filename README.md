## 初期設定

### Firebase

Firebase 新しいプロジェクトを追加
設定 > Web アプリへの追加
Authentication 有効化  
 Google Provider の追加
Firestore Database 有効化  
 Test モード
Asia-notheast-1(Tokyo)
Functions 有効化  
 プロジェクトをアップグレード

`firebase login`
`firebase init`
firestore,functions,storage,emulators
聞かれたことには全部 Yes で返す
Typescript を選択する。（好みで Javascript でもいい）

```こんな感じのを参考に
$ firebase init

     ######## #### ########  ######## ########     ###     ######  ########
     ##        ##  ##     ## ##       ##     ##  ##   ##  ##       ##
     ######    ##  ########  ######   ########  #########  ######  ######
     ##        ##  ##    ##  ##       ##     ## ##     ##       ## ##
     ##       #### ##     ## ######## ########  ##     ##  ######  ########

You're about to initialize a Firebase project in this directory:

  C:\Users\kumag\OneDrive\デスクトップ\works-private\11_timer-app\timer-app

? Are you ready to proceed? Yes
? Which Firebase features do you want to set up for this directory? Press Space to select features, then Enter to confirm your choices. Firestore: Configure security rules and indexes files for Firestore, Functions: Configure a Cloud Functions directory and its files, Stor
age: Configure a security rules file for Cloud Storage, Emulators: Set up local emulators for Firebase products

=== Project Setup

First, let's associate this project directory with a Firebase project.
You can create multiple project aliases by running firebase use --add,
but for now we'll just set up a default project.

? Please select an option: Use an existing project
? Select a default Firebase project for this directory: timer-app-d0e7e (timer-app)
i  Using project timer-app-d0e7e (timer-app)

=== Firestore Setup

Firestore Security Rules allow you to define how and when to allow
requests. You can keep these rules in your project directory
and publish them with firebase deploy.

? What file should be used for Firestore Rules? firestore.rules

Firestore indexes allow you to perform complex queries while
maintaining performance that scales with the size of the result
set. You can keep index definitions in your project directory
and publish them with firebase deploy.

? What file should be used for Firestore indexes? firestore.indexes.json

=== Functions Setup

A functions directory will be created in your project with sample code
pre-configured. Functions can be deployed with firebase deploy.

? What language would you like to use to write Cloud Functions? TypeScript
? Do you want to use ESLint to catch probable bugs and enforce style? Yes
+  Wrote functions/package.json
+  Wrote functions/.eslintrc.js
+  Wrote functions/tsconfig.json
+  Wrote functions/tsconfig.dev.json
+  Wrote functions/src/index.ts
+  Wrote functions/.gitignore
? Do you want to install dependencies with npm now? Yes

added 396 packages, and audited 397 packages in 23s

61 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

=== Storage Setup

Firebase Storage Security Rules allow you to define how and when to allow
uploads and downloads. You can keep these rules in your project directory
and publish them with firebase deploy.

? What file should be used for Storage Rules? storage.rules
+  Wrote storage.rules

=== Emulators Setup
? Which Firebase emulators do you want to set up? Press Space to select emulators, then Enter to confirm your choices. Authentication Emulator, Functions Emulator, Firestore Emulator, Storage Emulator
? Which port do you want to use for the auth emulator? 9099
? Which port do you want to use for the functions emulator? 5001
? Which port do you want to use for the firestore emulator? 8080
? Which port do you want to use for the storage emulator? 9199
? Would you like to enable the Emulator UI? Yes
? Which port do you want to use for the Emulator UI (leave empty to use any available port)?
? Would you like to download the emulators now? No

i  Writing configuration info to firebase.json...
i  Writing project information to .firebaserc...

+  Firebase initialization complete!
```
