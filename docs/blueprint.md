# **App Name**: TrustKart: Expiry-Aware Marketplace

## Core Features:

- Role-Based Access Control: Implement Firebase Authentication with custom claims to manage user roles (Customer, Shopkeeper, Admin, Super Admin, Delivery Agent, Farmer) and restrict access to specific features and data based on their roles.
- Expiry Date Management: Enable shopkeepers to set expiry dates for products, ensuring products can be filtered and displayed by expiry, alerting both customers and shopkeepers to expiring items.
- Admin Approval Workflow: Implement a shopkeeper registration process that requires admin approval, including document uploads and status tracking in Firestore.
- Real-time Order Management: Provide real-time updates on order status for customers and shopkeepers, using Firestore to reflect changes in order status.
- Automated Expiry Checker: Use a Cloud Function to automatically check for expired products daily, updating product status, creating refund tasks, and notifying affected parties.
- AI-Powered Expiry Discount Tool: Implement an AI tool that suggests automatic discounts for products nearing their expiry date to minimize waste, incorporating shop-specific configurations for discount rates and thresholds.
- Geo-fenced Delivery Assignment: For accepted orders, a list of nearby delivery agents can be suggested based on real-time location.

## Style Guidelines:

- Primary color: Saturated greenish-yellow (#C6C21B), reminiscent of fresh produce. It expresses freshness and a natural appeal.
- Background color: Desaturated, dark greenish-yellow (#262605). This dark background provides a high contrast and ensures readability.
- Accent color: Analogous, brighter, more saturated yellow (#FFFF00), for interactive elements.
- Headline font: 'Belleza', a humanist sans-serif (fashion-oriented, suitable for headlines).
- Body font: 'Alegreya', a humanist serif (elegant and contemporary, pairs well with Belleza).
- Code font: 'Source Code Pro' for displaying code snippets.
- Use simple, modern icons to represent product categories and actions, ensuring clarity and ease of use.
- Maintain a clean and organized layout, prioritizing key information such as product expiry dates and order status.
- Incorporate subtle animations for transitions and loading states to enhance user experience and provide feedback.