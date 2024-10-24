// Initialize Shopify App Bridge
// ... (Your App Bridge initialization code)

// Retrieve Shopify context
const shop = window.Shopify.shop;
const accessToken = window.Shopify.accessToken; // Securely passed from your server

async function makeShopifyApiRequest(endpoint, method = 'GET', data = null) {
    const url = `https://${shop}/admin/api/2023-10/${endpoint}`;

    const headers = {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
    };

    const options = { method, headers };
    if (data) options.body = JSON.stringify(data);

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            const errorData = await response.json(); // Attempt to parse error details
            const errorMessage = errorData?.errors?.[0] || response.statusText;
            throw new Error(`API request failed: ${response.status} - ${errorMessage}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        // Handle error (e.g., display error message to user)
        return null;
    }
}

// Fetch products
async function fetchProducts() {
    try {
        const products = await makeShopifyApiRequest('products.json');
        if (products &amp;&amp; products.products) {
            renderProducts(products.products);
        } else {
            console.error('Failed to fetch products:', products);
            // Display error message to user
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        // Display error message to user
    }
}

// Render product list with discount options
function renderProducts(products) {
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '';

    products.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.innerHTML = `
            <h3>${product.title}</h3>
            <input type="checkbox" id="enable-discount-${product.id}"> Enable Discount
            <div class="discount-options" style="display:none">
                Quantity: <input type="number" id="quantity-${product.id}" value="1" min="1">
                Discount: <input type="number" id="discount-${product.id}" value="0" min="0"> % or $ (based on discount type)
            </div>
        `;
        productsContainer.appendChild(productDiv);

        // Event listeners for discount toggle and input changes
        const enableDiscountCheckbox = document.getElementById(`enable-discount-${product.id}`);
        const discountOptions = productDiv.querySelector('.discount-options');
        enableDiscountCheckbox.addEventListener('change', () => {
            discountOptions.style.display = enableDiscountCheckbox.checked ? 'block' : 'none';
        });

        const quantityInput = document.getElementById(`quantity-${product.id}`);
        const discountInput = document.getElementById(`discount-${product.id}`);
        [quantityInput, discountInput].forEach(input => {
            input.addEventListener('change', () => {
                if (enableDiscountCheckbox.checked) {
                    const quantity = parseInt(quantityInput.value, 10);
                    const discount = parseFloat(discountInput.value);
                    applyDiscount(product.id, quantity, discount);
                }
            });
        });
    });
}

// Apply discount
async function applyDiscount(productId, quantity, discount) {
    const discountType = document.getElementById('discountType').value;
    const discountScope = document.getElementById('discountScope').value;
    const collectionId = document.getElementById('collectionId').value;

    // Input validation
    if (isNaN(quantity) || quantity <= 0 || isNaN(discount) || discount < 0) {
        console.error('Invalid quantity or discount value.');
        return;
    }

    try {
        let requestData = {};

        if (discountScope === 'product') {
            // Product-specific discount (using variant update)
            const variantId = getVariantIdForProduct(productId); // Replace with your logic
            const updatedPrice = calculatePrice(product.price, discount, discountType); // Implement price calculation

            requestData = {
                variant: {
                    id: variantId,
                    price: updatedPrice,
                },
            };

            const response = await makeShopifyApiRequest(`variants/${variantId}.json`, 'PUT', requestData);
            // Handle API response
        } else if (discountScope === 'all' || discountScope === 'collection') {
            // Collection-wide or all-products discount (using price rules)
            requestData = {
                price_rule: {
                    title: `Quantity Discount - ${quantity} for ${discount}${discountType === 'percentage' ? '%' : '$'} off`,
                    target_type: discountScope === 'all' ? 'all' : 'collection',
                    target_selection: discountScope === 'all' ? '' : collectionId,
                    allocation_method: 'across', // Example allocation method
                    value_type: discountType === 'percentage' ? 'percentage' : 'fixed_amount',
                    value: discount.toString(), // Discount value as a string
                    customer_selection: 'all', // Example customer selection
                    // ... other price rule settings
                    starts_at: new Date().toISOString(), // Start the discount immediately
                },
            };

            const response = await makeShopifyApiRequest('price_rules.json', 'POST', requestData);
            // Handle API response and discount code creation
        } else {
            console.error('Invalid discount scope:', discountScope);
            // Handle error, e.g., display a message to the user
        }
    } catch (error) {
        console.error('Error applying discount:', error);
        // Display error message to user
    }
}

// Helper function to calculate the discounted price
function calculatePrice(originalPrice, discount, discountType) {
    if (discountType === 'percentage') {
        return originalPrice * (1 - discount / 100);
    } else { // 'fixed'
        return originalPrice - discount;
    }
}


// Call fetchProducts after App Bridge initialization
fetchProducts();
