# Midnight Luxury Shop

Create a mobile-first ecommerce app designed exclusively for smartphone users. Do not design for desktop or tablet layouts. The entire experience should feel like a premium mobile shopping app rather than a traditional ecommerce website.

1. Overall Design

Use a premium black theme throughout the application.

Colors

Primary background: deep premium black, such as #050505 or #000000

Cards: slightly lighter black, such as #0D0D0D

Primary text: white

Secondary text: muted gray

Accent color: elegant electric blue

Success: subtle green

Borders: very dark gray with low contrast

The UI should feel:

Premium

Minimal

Modern

Clean

Fast

Mobile-native

Spacious without wasting screen space

Use subtle animations, smooth transitions, soft shadows, rounded cards, and tasteful blue highlights.

Do not make the interface complicated.

2. Mobile-Only Layout

The application should be optimized for approximately 360px–430px phone widths.

Use:

Bottom navigation

Large touch targets

Sticky cart/checkout controls where appropriate

Mobile-friendly product cards

Mobile-friendly forms

Mobile-friendly payment screens

Do not create desktop navigation, desktop sidebars, or wide desktop layouts.

3. Intro Splash Screens

Create a short premium onboarding experience when the app opens for the first time.

Splash Screen 1

Premium black background

App logo centered

Minimal animation

App name

Short tagline

Splash Screen 2

Show a simple visual introducing the shopping experience.

Example:
"Shop Premium. Keep It Simple."

Splash Screen 3

Introduce the optional Premium membership.

Example:
"Unlock Rewards With Premium."

Explain briefly that Premium customers can earn loyalty and referral points that can later be redeemed for products.

Include:

Skip button

Next button

Get Started button

Store onboarding completion so returning users do not repeatedly see the intro screens.

4. Home Screen

The home screen should immediately show products.

At the top:

App logo/name

Search icon

Cart icon

Optional profile icon

Below that:

Featured Products

Display products using clean mobile cards.

Each product card should contain ONLY:

Product image

Product name

Price

Add to Cart

Buy Now

IMPORTANT

Do NOT create product descriptions.

Do not show:

Long descriptions

Specifications

Product paragraphs

Product detail tabs

Reviews

Complicated product information

Keep product presentation extremely simple.

5. Product Cards

Each product card should look premium and minimal.

Example:

Product Name

KSh 2,500

[ Add to Cart ]
[ Buy Now ]

The product image should be the dominant visual element.

Use smooth press animations when buttons are tapped.

6. Buy Now Flow

The Buy Now button should immediately take the customer toward checkout.

Flow:

Product → Checkout → M-Pesa Payment → Order Confirmation

Do not make customers go through unnecessary pages.

Checkout should contain:

Product

Quantity

Price

Total

Customer name

Phone number

Delivery information

M-Pesa payment option

Pay Now button

The payment method should be clearly labeled:

M-Pesa

Use Kenyan currency:

KSh

7. Add to Cart Flow

When the customer taps Add to Cart:

Add the product to the cart

Show a small confirmation animation

Update the cart badge

Keep the customer on the current screen

Cart should contain:

Product image

Product name

Price

Quantity controls

Remove button

Total amount

Checkout button

Checkout should then proceed to the M-Pesa payment flow.

8. M-Pesa Checkout

Design a very simple M-Pesa checkout experience.

The customer enters their M-Pesa phone number.

Display:

Pay KSh [TOTAL] via M-Pesa

Button:

Pay with M-Pesa

The architecture should be prepared for integration with the Safaricom Daraja API / M-Pesa STK Push.

Do not fake successful payments.

Create the frontend/payment service structure so the actual Daraja credentials and backend endpoint can be connected later.

Payment states should include:

Payment initiated

Waiting for payment

Payment successful

Payment failed

Payment cancelled

Payment timeout

After successful payment:

Payment Successful

Show:

Order number

Amount paid

Product/order summary

Button:

Continue Shopping

9. Premium Version

Create a Premium section inside the app.

Premium is an optional upgrade that customers unlock through a one-time payment.

It should NOT be a subscription.

Display:

Premium

Unlock Premium Rewards

Premium customers receive:

Loyalty Points

Referral Points

Ability to redeem points for products

Show a premium upgrade screen with a clean premium design.

Example:

Unlock Premium

One-time payment: KSh [PRICE]

Button:

Unlock Premium

After successful payment, permanently mark the customer's account as Premium.

Do not require monthly or yearly payments.

10. Premium Dashboard

Once Premium is enabled, the customer should see a Premium dashboard.

Display two major cards:

Loyalty Points

Example:

2,450

Loyalty Points

Button:

Redeem

Referral Points

Example:

1,200

Referral Points

Button:

Redeem

Keep these interfaces visually simple.

Use blue accent gradients or subtle blue glow effects against the black background.

11. Loyalty Points UI

Create a dedicated Loyalty Points screen.

Display:

Your Loyalty Points

2,450 Points

Show a simple transaction/history list:

Points earned

Points redeemed

Date

Amount

Do not make this overly complicated.

Include:

Redeem Points

Customers should be able to use eligible points toward products.

12. Referral Points UI

Create a dedicated Referral Points screen.

Display:

Your Referral Points

1,200 Points

Include:

Your Referral Code

[ COPY ]

And:

Share Referral

The customer should be able to share their referral code/link.

Show referral activity:

Referral completed

Points earned

Date

Include:

Redeem Points

Referral points can also be redeemed toward products.

13. Points Redemption

Create a simple redemption interface.

Customer selects a product and chooses to pay using available points.

Example:

Product

KSh 2,500

2,500 Points

[ Redeem ]

If the customer does not have enough points, clearly show:

Not enough points

Do not allow redemption when the customer has insufficient points.

The system should prevent negative point balances.

14. Account Screen

Create a simple mobile account page.

Display:

Customer name

Phone number

Premium status

Orders

Loyalty Points

Referral Points

Referral Code

Settings

Logout

If the customer is not Premium:

Show:

Upgrade to Premium

15. Bottom Navigation

Use a fixed mobile bottom navigation bar.

Navigation:

Home | Categories | Cart | Premium | Account

Use simple icons and labels.

The navigation should have a premium black appearance with subtle blue active-state highlighting.

16. Authentication

Create a simple customer authentication system.

Include:

Sign Up

Name

Phone number

Password

Sign In

Phone number

Password

Keep authentication simple and mobile-friendly.

Customers should remain logged in between app sessions.

17. Backend/Data Architecture

Structure the project so it can eventually connect to a real backend.

Recommended stack:

React

TypeScript

Tailwind CSS

Supabase

Create appropriate database structures for:

Products

id

name

price

image

stock

category

active

Customers

id

name

phone

premium_status

premium_unlocked_at

referral_code

Orders

id

customer_id

total

payment_status

order_status

created_at

Order Items

order_id

product_id

quantity

price

Loyalty Points

customer_id

points

transaction_type

amount

created_at

Referral Points

customer_id

points

transaction_type

amount

created_at

Referrals

referrer_id

referred_customer_id

status

points_awarded

created_at

Premium Payments

customer_id

amount

payment_reference

status

created_at

18. Important Business Rules

Implement these rules in the application architecture:

Premium is unlocked through one one-time payment.

Premium does not expire.

Premium customers can access Loyalty Points.

Premium customers can access Referral Points.

Non-Premium customers cannot access the points dashboard.

Points cannot have negative balances.

Customers cannot redeem more points than they own.

Orders must have a payment status.

M-Pesa payments must be verified by the backend before an order is marked as paid.

Do not trust frontend payment-success responses.

Products must respect available stock.

Cart quantities cannot exceed available stock.

19. Admin Preparation

Create the application structure so an admin dashboard can be connected later.

The admin should eventually be able to manage:

Products

Prices

Product images

Stock

Orders

Customers

Premium customers

Premium payments

Loyalty points

Referral points

Referrals

For this task, prioritize the customer-facing mobile app UI and core architecture.

20. UX Rules

The most important requirement is simplicity.

Avoid:

Product descriptions

Excessive text

Complicated menus

Large desktop layouts

Unnecessary product-detail pages

Complicated filters

Cluttered dashboards

The customer should be able to:

Open app → See products → Buy → Pay with M-Pesa

in as few steps as possible.

Premium customers should be able to:

Open Premium → See points → Redeem → Buy products

The final result should look like a high-end black mobile shopping application, with black as the dominant color and blue used as the premium accent.

Make the UI polished, responsive, touch-friendly, and production-ready.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1ca80f01-6ee7-4dfe-a080-b2f2db9e3738).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
