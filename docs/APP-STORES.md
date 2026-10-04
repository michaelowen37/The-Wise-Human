# Putting The Wise Human in the App Store and Google Play

Written September 25, 2026, from the stores' published rules and reporting at the time. Fees, deadlines and payment rules change; check each store's current terms before acting on any line here.

## The approach

The app is already one self-contained page that works offline. Wrap it with Capacitor (free, open source) so the page ships inside each app, not loaded from a website. That keeps it fully offline, avoids Apple's most common rejection (an app that is only a web page), and lets it use real device features. Google Play can also take a Trusted Web Activity built with PWABuilder, but one Capacitor project serves both stores.

## Steps

1. Get a D-U-N-S number for iECHO, LLC (free from Dun & Bradstreet; it can take a few weeks). Both stores use it to verify the company.
2. Give iECHO a real website on its own domain, with a work email on that domain, a privacy policy page and a support page. Apple checks the website during enrollment; both stores require the privacy policy link.
3. Enroll iECHO in the Apple Developer Program as an organization (99 dollars a year) and create a Google Play organization developer account (25 dollars once). Organization accounts show the company as the seller, and on Google Play they skip the testing rule new personal accounts face (12 testers for 14 days).
4. Get a Mac with Xcode, or rent one in the cloud. Apple builds need one; Android builds do not.
5. Make the Capacitor project: the built index.html as the app's web content, the icons already in icons/, a splash screen, and bundle ids such as com.iecho.wisehuman.
6. Add the native pieces that make it an app, not a wrapped page: backups saved and shared through the device's own share sheet and Files app, durable storage that the system will not clear, and the device's back gesture on Android. Keep the Content Security Policy.
7. Add a clear Erase this classroom from this device control. Apple expects apps that create accounts to let people delete them.
8. Decide how people pay. Inside the apps, digital unlocks normally go through Apple and Google billing (15 percent for small businesses in their programs). In the United States, Apple must currently allow a link to buy on your own site; the fee for that is still being decided in court, so build it so the price path can change. Put any purchase or outside link behind a grown-up check (a parental gate) for a children's app.
9. Choose the category: Education, not the Kids category, unless you want its extra rules. Either way, children's apps must not send personal data to third parties or include third-party ads or analytics. The Wise Human collects nothing, which makes the privacy forms simple: Data Not Collected on Apple's privacy label and No data collected on Google's Data safety form.
10. Fill in the age rating questionnaires, the store descriptions, and screenshots for each phone and tablet size.
11. Test: TestFlight on Apple and an internal or closed test on Google Play, on real phones and tablets, including a device with no internet.
12. Submit. Give reviewers a note saying the app works offline and needs no login, and how to open the educator side (the PIN they should use on the review build).
13. For schools: opt in to Apple's volume purchasing for education (schools buy through Apple School Manager) and look at Google's managed Play for Chromebooks. Schools can also install the web app directly.
14. Keep up: Apple renews yearly (apps are removed if it lapses), and Google Play raises its required Android version every year (new apps and updates must target Android 16 from August 31, 2026).

## What it changes in the app

- The service worker is not needed inside the apps; the files ship in the package.
- The Claude preview and the website stay as they are; the store apps are one more way in.
- Every store update is a new review, so batch changes into releases.
