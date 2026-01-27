# CampusPulse 🚀

AI-Driven Peer-to-Peer Resource Mesh for Students

CampusPulse is a hyperlocal web solution that transforms a university campus into a dynamic, shared resource pool. Built with Next.js and Firebase, it enables students to share resources—from calculators to textbooks—using AI-powered inventory management and a secure, trust-based handshake protocol.

🌟 Key Features
- **📸 AI Digital Locker**: Simply upload a photo of any item, and Google Gemini automatically identifies, and suggests a name for it, adding it to your digital locker for others to borrow.
- **⚡ Hyperlocal Discovery**: Find items available for rent in "Nearby Lockers" from students within a 500m radius.
- **🚨 Emergency Alerts**: Need something urgently? Create an "Emergency" request that instantly notifies nearby users with a distinct device vibration.
- **🛡️ Secure PIN Handshake**: A fraud-proof transaction system. Users verify exchanges by swapping unique 4-digit PINs for both handover and return, securing the peer-to-peer trust loop.
- **💎 Karma Reputation System**: Earn "Karma Points" for every successful rental. Build a public profile that showcases your rating, activity, and contribution to the campus community. You can even withdraw Karma points for canteen credit!
- **💬 In-App Chat**: Coordinate pickups and returns seamlessly with a real-time chat interface built into every transaction.
- **🤖 AI Assistant "AskIt"**: A friendly, floating chatbot powered by GenAI to help you navigate the app and answer any questions about its features.
- **🎨 Customizable UI**: Tailor the app's appearance to your liking with both Light and Dark modes, and even choose a custom background color for the light theme.
- **🎓 University SSO**: Exclusive access restricted to users with a `@gla.ac.in` domain to ensure a safe, closed-loop environment for students.

🛠️ Tech Stack
- **Framework**: Next.js (App Router)
- **Frontend**: React, Tailwind CSS, ShadCN UI
- **Backend**: Firebase (Authentication, Firestore, App Hosting)
- **AI Intelligence**: Genkit with Google Gemini models (for Vision, Text Processing, and Chat)
- **Maps**: Google Maps SDK for hyperlocal discovery
- **State Management**: Jotai, React Context

Application Deplyement Link
- 

🏗️ Architecture Overview
CampusPulse follows a component-driven, real-time architecture to ensure a responsive user experience:

- **The Item Listing**: The user uploads an image in the `AddItemDialog`. The image data is sent to a Genkit flow which uses Gemini to identify the item. The identified name is populated in the form, and upon submission, the new item is saved to the `itemListings` collection in Firestore.
- **The Request**: A user creates a request via the `requests` page, which is stored in the `itemRequests` collection with location data. The dashboard (`dashboard/page.tsx`) queries these requests in real-time. Emergency requests trigger a special alert for users within a 500m radius.
- **The Handshake**: When a user fulfills a request or requests an item from a nearby locker, a `transaction` document is created. This document manages the state, including the hashed PINs for handover and return. The UI in `transaction/[id]/page.tsx` guides both the lender and borrower through the verification process, updating the transaction status in Firestore at each step.
- **The Feedback Loop**: Upon `COMPLETED` status, users are prompted to leave feedback. The `FeedbackForm` component runs a Firestore transaction to atomically update the rated user's average rating and Karma Points, and marks the transaction to show feedback has been given.
