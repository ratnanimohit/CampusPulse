# **App Name**: Campus Collab

## Core Features:

- User Lockers: Users can create profiles and 'lockers' to list items for rent, with @gla.ac.in email verification.
- Image to Item ID: Upload images of items, use Google Image Recognition to identify item type. A tool will present a fallback that enables manual entry for unrecognized items.
- Needs categorization: Categorize requests by urgency: Emergency, Medium, Normal, affecting the radius of the item search. Set the expected date and time when the item should be available.
- Item Recommendations: Suggest optimal pricing for rental items, leveraging user preferences.
- QR Code Confirmation: Generate and scan QR codes for item check-out and return, updating user profiles accordingly. All the events shall trigger Cloud Functions to handle business logic.
- Karma Points: Implement a Karma Points system convertible to canteen credit, awarded based on transaction ratings (0-5 stars).
- Transaction Limits: Restrict users to a maximum of 5 transactions per day for fairness.

## Style Guidelines:

- Primary color: Use a vibrant green (#A0D6B4) to represent growth and community.
- Background color: Light, desaturated green (#E2F0E8) for a calm and approachable feel.
- Accent color: Use a contrasting orange (#F4B36A) to highlight interactive elements and calls to action.
- Headline font: 'Poppins' (sans-serif) for headlines, for a contemporary, geometric style
- Body font: 'PT Sans' (sans-serif) for body text, ensuring readability and accessibility
- Employ clean, outline-style icons to represent item categories and transaction types.
- Use subtle animations to confirm actions and guide users through transaction flows.