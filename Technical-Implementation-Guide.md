# Sport Store - Technical Implementation Guide

## Authentication System

The authentication process begins when a user accesses the Login component located at `frontend/src/components/Login.js`. When the user submits their credentials, the `handleSubmit` function sends a POST request to the backend endpoint at `/api/users/login/`. This request is routed through Django's URL configuration system, starting at `online_store/urls.py`, which delegates to `users/urls.py`, and finally reaches the `LoginView` class in `users/views.py`.

The backend validates the provided email and password against the database. Upon successful validation, it generates two JWT tokens using the `djangorestframework-simplejwt` library: an access token with a 60-minute validity period and a refresh token valid for 24 hours. These tokens are returned to the frontend along with basic user information.

The Login component stores these tokens in the browser's localStorage for persistence across sessions. After storing the authentication credentials, the system checks for any items in the guest cart. If present, the `syncGuestCart` function transfers these items to the user's authenticated cart by making individual POST requests to `/api/cart/`. Once synchronization is complete, the guest cart is removed from localStorage, and the user is redirected to the home page.

## Guest Cart Implementation

The guest cart feature allows unauthenticated users to add products to their cart using localStorage as a temporary storage mechanism. When a user clicks "Add to Cart" on the ProductListPage or ProductDetailPage, the `handleAddToCart` function first checks for the presence of an access token in localStorage to determine authentication status.

For guest users, the function retrieves the current cart from localStorage, which is stored as a JSON array containing product IDs and quantities. The function checks if the product already exists in the cart. If found, it increments the quantity; otherwise, it adds a new entry. The updated cart is saved back to localStorage, and a notification informs the user that the item was added successfully.

This approach minimizes backend communication for guest users, improving response time and reducing server load. The guest cart data remains in localStorage until the user logs in or manually clears their browser data.

## Authenticated Cart Operations

For authenticated users, cart operations involve backend communication to ensure data persistence. When a logged-in user adds a product to their cart, the `handleAddToCart` function calls `apiService.addToCart()`, which sends a POST request to `/api/cart/` with the product ID and quantity.

The request is routed to the `CartView` class in `cart/views.py`. The backend retrieves or creates a Cart object for the user, then checks if a CartItem already exists for the specified product. If it exists, the quantity is incremented; if not, a new CartItem is created. The backend also validates stock availability before completing the operation.

Upon successful addition, the backend serializes the entire cart using the CartSerializer and returns it to the frontend. This approach ensures that cart data persists across devices and sessions, as it is stored in the database rather than the browser.

## Cart Display for Guest Users

When a guest user navigates to the cart page, the CartPage component's `loadCart` function checks for authentication. For guest users, it retrieves the cart array from localStorage. However, this array contains only product IDs and quantities, not complete product information.

To display the cart properly, the function makes individual API requests to `/api/products/{id}/` for each item to fetch full product details including name, price, and image. Once all product information is retrieved, the function constructs a cart object that matches the structure of authenticated cart responses. This formatted cart is then rendered in the UI.

Guest cart items are assigned temporary IDs in the format `guest-0`, `guest-1`, etc. When users update quantities or remove items, these operations modify the localStorage array directly and trigger a cart reload.

## Order Creation Process

The checkout process begins when a user proceeds from their cart to the CheckoutPage component. The user enters shipping address, billing address, and payment information. When the "Place Order" button is clicked, the `handleCheckout` function sends a POST request to `/api/orders/` with the collected form data.

The backend's `OrderListCreateView` in `orders/views.py` handles this request. It first retrieves the user's cart and validates that it contains items. The view then creates a new Order object with the provided address information and sets the initial status to "Pending".

Next, the view iterates through each CartItem, creating corresponding OrderItem objects. These OrderItems serve as permanent records of the purchase, including the price at the time of order. The view calculates the total price, decrements product stock quantities, and clears the user's cart. The newly created Order is serialized and returned to the frontend, which redirects the user to the Order History page.

## Review System and Eligibility Verification

The review system implements an eligibility check to ensure that only users who have purchased a product can write reviews. When a user visits a product detail page, the ProductDetailPage component makes a GET request to `/api/reviews/check-eligibility/{product_id}/`.

The backend's `CheckReviewEligibility` view performs two database queries. First, it checks the OrderItem table to verify that the user has purchased the product and that the order status is "Delivered". Second, it checks the Review table to ensure the user has not already reviewed this product.

The view returns a response containing eligibility flags. Based on these flags, the frontend conditionally renders either the review form or an explanatory message. When a user submits a review, the backend creates a new Review object and recalculates the product's average rating by querying all reviews for that product and updating the Product model accordingly.

## Category Filtering and Search

The category filtering system uses URL parameters to filter products. When a user clicks a category button on the ProductListPage, the component updates the `selectedCategory` state, which triggers a useEffect hook that calls `loadProducts()` with the category parameter.

The API request includes a query parameter such as `?category=2`. Django's filtering system, using the `django-filters` library, processes this parameter and adds a WHERE clause to the database query, returning only products matching the specified category.

The search functionality is implemented both on the frontend and backend. For the current dataset size, the frontend performs client-side filtering by checking if the search term appears in product names or descriptions. This provides immediate feedback without additional API calls. The backend also supports search through Django REST Framework's SearchFilter for scalability.

## Guest Cart Synchronization

The guest cart synchronization process occurs immediately after successful login. The `syncGuestCart` function retrieves the guest cart from localStorage and processes each item sequentially. For each item, it makes a POST request to `/api/cart/` with the product ID and quantity, using the newly obtained access token for authentication.

The backend handles each request through the CartView's post method. If the product already exists in the user's cart, the quantities are merged. If not, a new CartItem is created. This ensures that items from both the guest cart and any existing authenticated cart are preserved.

Error handling is implemented to ensure that if one item fails to sync, the remaining items continue to process. After all items are synchronized, the guest cart is removed from localStorage to prevent duplicate entries on subsequent logins.

## Database Model Structure

The database schema is organized around several core models. The User model, provided by Django's authentication system, has a one-to-one relationship with the Cart model. Each Cart contains multiple CartItems, which reference Products and store quantities.

When an order is placed, an Order object is created with a foreign key to the User. The Order contains multiple OrderItems, which are permanent records of purchased products. OrderItems store the price at the time of purchase to maintain accurate historical data even if product prices change.

The Review model connects Users and Products through foreign keys, allowing users to rate and comment on products they have purchased. This relational structure enables complex queries such as retrieving all products purchased by a user or calculating average ratings for products.

## API Service Layer

The API service layer, implemented in `frontend/src/services/apiService.js`, centralizes all backend communication. This service provides methods for common HTTP operations including GET, POST, PUT, and DELETE requests.

The service automatically handles several tasks: it prepends the base URL to all endpoint paths, retrieves the JWT access token from localStorage and includes it in the Authorization header, and checks response status codes to throw errors for failed requests. This centralization eliminates code duplication and ensures consistent error handling across the application.

The service also provides convenience methods for specific operations such as `addToCart`, `updateCartItem`, and `deleteCartItem`, which encapsulate the endpoint URLs and request formatting. This abstraction makes the calling code cleaner and more maintainable.

## State Management Approach

The application uses React's built-in state management through useState and useEffect hooks rather than external libraries. Each page component manages its own state for the data it displays. This approach is sufficient for the application's current scale and complexity.

Authentication state is managed through localStorage rather than React state to ensure persistence across page refreshes and component unmounts. Components check localStorage directly when determining authentication status.

Data that needs to be shared across components is passed through React Router's URL parameters. For example, product IDs are included in the URL path, and components extract these parameters using React Router's useParams hook.

## Error Handling and User Feedback

Error handling is implemented at multiple levels. The API service checks response status codes and throws errors for failed requests. Components catch these errors using try-catch blocks and update error state variables to display appropriate messages to users.

User feedback is provided through toast notifications, which are temporary messages that appear on screen. Each component that performs user actions maintains toast state with properties for visibility, message text, and type (success or error). A timeout automatically hides the toast after a few seconds.

Loading states are managed through boolean state variables that are set before API requests and cleared when requests complete. The UI conditionally renders loading indicators based on these states, providing visual feedback that operations are in progress.

Form validation occurs on both frontend and backend. Frontend validation provides immediate feedback for user input errors, while backend validation ensures data integrity and security by verifying all inputs server-side.
