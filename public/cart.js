
(function() {
    'use strict';

    // ==================== КОНСТАНТЫ И ПЕРЕМЕННЫЕ ====================
    const CART_STORAGE_KEY = 'mos_cart';
    let cart = [];

    // ==================== УТИЛИТЫ ====================
    // Получить корзину из localStorage
    function loadCart() {
        const stored = localStorage.getItem(CART_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    // Сохранить корзину в localStorage
    function saveCart() {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        updateCartIcon();
    }

    // Найти товар в корзине по ID и size
    function findInCart(productId, size = 'default') {
        return cart.find(item => 
            item.id === productId && item.size === size
        );
    }

    // ==================== ОБНОВЛЕНИЕ ИКОНКИ КОРЗИНЫ ====================
    function updateCartIcon() {
        const cartIcon = document.querySelector('.cart-button');
        const counter = document.querySelector('.cart-counter') || createCounter();

        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (totalQty > 0) {
            counter.textContent = totalQty;
            counter.style.display = 'flex';
        } else {
            counter.textContent = '0';
            counter.style.display = 'none';
        }
    }

    // Создать счётчик для иконки корзины
    function createCounter() {
        const cartIcon = document.querySelector('.cart-button');
        if (!cartIcon) return null;

        const counter = document.createElement('div');
        counter.className = 'cart-counter';
        counter.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: #BA1F2D;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
        `;
        cartIcon.style.position = 'relative';
        cartIcon.appendChild(counter);
        return counter;
    }

    // ==================== ОСНОВНЫЕ ФУНКЦИИ КОРЗИНЫ ====================
    // Добавить товар в корзину
    function addToCart(product) {
        const { id, name, price, image, size = 'default' } = product;
        
        const existing = findInCart(id, size);
        
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id,
                name,
                price: parseInt(price) || 0,
                image: image || '',
                size,
                quantity: 1
            });
        }
        
        saveCart();
        showNotification('Товар добавлен в корзину');
        return true;
    }

    // Удалить товар из корзины
    function removeFromCart(productId, size = 'default') {
        const index = cart.findIndex(item => 
            item.id === productId && item.size === size
        );
        
        if (index !== -1) {
            cart.splice(index, 1);
            saveCart();
            renderCart(); // Перерендерим, если на странице корзины
            return true;
        }
        return false;
    }

    // Изменить количество товара
    function updateQuantity(productId, newQuantity, size = 'default') {
        const item = findInCart(productId, size);
        
        if (item) {
            if (newQuantity < 1) {
                removeFromCart(productId, size);
            } else {
                item.quantity = newQuantity;
                saveCart();
                renderCart(); // Перерендерим, если на странице корзины
            }
            return true;
        }
        return false;
    }

    // Очистить корзину
    function clearCart() {
        if (cart.length === 0) return;
        
        if (confirm('Очистить корзину?')) {
            cart = [];
            saveCart();
            renderCart(); // Перерендерим, если на странице корзины
            showNotification('Корзина очищена');
        }
    }

    // Получить общую сумму
    function getTotalPrice() {
        return cart.reduce((total, item) => 
            total + (item.price * item.quantity), 0
        );
    }

    // ==================== ВАЛИДАЦИЯ ФОРМЫ ====================
    function validateFormData(data) {
        const errors = [];

        // Валидация ФИО (три слова)
        if (!data.name || data.name.trim().split(/\s+/).length < 3) {
            errors.push('ФИО должно состоять из трех слов (Фамилия Имя Отчество)');
        }

        // Валидация телефона
        const phoneRegex = /^\+7\s?\(?\d{3}\)?\s?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
        const cleanPhone = data.phone.replace(/\D/g, '');
        if (!data.phone || cleanPhone.length !== 11 || !phoneRegex.test(data.phone)) {
            errors.push('Введите корректный номер телефона России (например: +7 (999) 123-45-67)');
        }

        // Валидация индекса (6 цифр)
        const zipRegex = /^\d{6}$/;
        if (!data.zip || !zipRegex.test(data.zip)) {
            errors.push('Индекс должен состоять из 6 цифр');
        }

        // Валидация адреса
        if (!data.address || data.address.trim().length < 10) {
            errors.push('Введите полный адрес доставки (не менее 10 символов)');
        }

        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email)) {
            errors.push('Введите корректный email адрес');
        }

        if (errors.length > 0) {
            showNotification(errors.join('\n'));
            return false;
        }

        return true;
    }

    // ==================== ОБРАБОТКА ФОРМЫ ЗАКАЗА ====================
    async function submitOrderForm(formData) {
        // Валидация данных
        if (!validateFormData(formData)) {
            return false;
        }

        // Проверяем, что корзина не пуста
        if (cart.length === 0) {
            showNotification('Корзина пуста!');
            return false;
        }

        // Формируем данные заказа
        const orderData = {
            customer: formData,
            items: [...cart], // копируем массив товаров
            total: getTotalPrice(),
            date: new Date().toISOString(),
            orderId: 'ORD-' + Date.now().toString().slice(-8)
        };

        try {
            // Отправляем на сервер
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            const result = await response.json();
            
            if (response.ok) {
                // Очищаем корзину только после успешного ответа от сервера
                cart = [];
                saveCart();
                renderCart();
                updateCartIcon();
                
                showNotification('✅ ' + result.message);
                return true;
            } else {
                throw new Error(result.error || 'Ошибка сервера');
            }
        } catch (error) {
            console.error('Ошибка при отправке заказа:', error);
            showNotification('❌ Ошибка: ' + error.message);
            return false;
        }
    }

    // ==================== РЕНДЕРИНГ КОРЗИНЫ (для cart.html) ====================
function renderCart() {
    const cartContainer = document.querySelector('.cart-list');
    const totalContainer = document.querySelector('[cart-product-info="total"]');
    const orderList = document.querySelector('.order-list');
    
    if (!cartContainer) return; // Не на странице корзины

    // Очищаем контейнер
    cartContainer.innerHTML = '';

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart" style="text-align: center; padding: 40px;">
                <p style="font-size: 18px; color: #666;">Корзина пуста</p>
                <a href="category.html" class="button main-button" style="margin-top: 20px; display: inline-block;">
                    <span>Перейти в каталог</span>
                </a>
            </div>
        `;
        if (totalContainer) totalContainer.textContent = '0';
        renderOrderSummary();
        return;
    }

    // Рендерим каждый товар
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'div cart-list_item-container';
        itemElement.setAttribute('cart-product-info', 'product');
        itemElement.innerHTML = `
            <div cart-product-info="img" class="image image--u-ij9c7bg7s">
                <img src="${item.image}" alt="${item.name}" class="image__img">
            </div>
            <h3 cart-product-info="name" class="text bold-accent-text">
                <span>${item.name} ${item.size !== 'default' ? `(${item.size})` : ''}</span>
            </h3>
            <div class="div number-container main-text">
                <div class="div number-container_button minus-btn" data-id="${item.id}" data-size="${item.size}">
                    <div class="text">-</div>
                </div>
                <div class="div number-container_text">
                    <p cart-product-info="number" class="text">${item.quantity}</p>
                </div>
                <div class="div number-container_button plus-btn" data-id="${item.id}" data-size="${item.size}">
                    <div class="text">+</div>
                </div>
            </div>
            <div class="div cart-product-cost">
                <p cart-product-info="cost" class="text main-text">${item.price * item.quantity}</p>
                <p class="text main-text">₽</p>
            </div>
            <div class="remove-btn" data-id="${item.id}" data-size="${item.size}" style="
                position: absolute;
                top: 10px;
                right: 10px;
                cursor: pointer;
                color: #999;
                font-size: 20px;
                background: #f5f5f5;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            ">×</div>
        `;
        cartContainer.appendChild(itemElement);
    });

    // Обновляем итоговую сумму
    const total = getTotalPrice();
    const totalElements = document.querySelectorAll('[cart-product-info="total"]');
    totalElements.forEach(el => {
        if (el.textContent !== '₽') {
            el.textContent = total;
        }
    });
    
    // Обновляем список в форме заказа
    renderOrderSummary();
}

    // Рендерим список в форме заказа
    function renderOrderSummary() {
        const orderList = document.querySelector('.order-list');
        if (!orderList) return;

        const itemsContainer = orderList.querySelector('[order-product-info="product"]');
        const totalContainer = orderList.querySelector('[order-product-info="total"]');
        
        if (!itemsContainer || !totalContainer) return;

        // Очищаем старые товары (кроме первого элемента-шаблона и итоговой строки)
        const existingItems = orderList.querySelectorAll('.order-list_item');
        existingItems.forEach((item, index) => {
            if (index > 0) item.remove();
        });

        // Если корзина пуста
        if (cart.length === 0) {
            totalContainer.textContent = '0';
            return;
        }

        // Добавляем товары
        cart.forEach(item => {
            const itemClone = itemsContainer.cloneNode(true);
            itemClone.classList.remove('order-list_item-total');
            itemClone.querySelector('[order-product-info="name"]').textContent = 
                `${item.name} ${item.size !== 'default' ? `(${item.size})` : ''} x${item.quantity}`;
            itemClone.querySelector('[cart-product-info="cost"]').textContent = 
                `${item.price * item.quantity} ₽`;
            orderList.insertBefore(itemClone, orderList.querySelector('.order-list_item-total'));
        });

        // Обновляем итог
        totalContainer.textContent = getTotalPrice();
    }

    // ==================== УВЕДОМЛЕНИЯ ====================
    function showNotification(message) {
        // Проверяем, есть ли уже уведомление
        const existingNotification = document.querySelector('.cart-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #000000ff;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            animation: fadeInOut 3s ease;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Добавляем стили для анимации
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateY(10px); }
                    10% { opacity: 1; transform: translateY(0); }
                    90% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(10px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // ==================== ОБРАБОТЧИКИ СОБЫТИЙ ====================
    function setupEventListeners() {
        // 1. Кнопка "Добавить в корзину" на странице товара
        document.addEventListener('click', function(e) {
            const addBtn = e.target.closest('[role="button"]');
            if (addBtn && addBtn.textContent.includes('Добавить в корзину')) {
                const productCard = addBtn.closest('.product-page_container') || 
                                   addBtn.closest('.collection__item');
                
                if (!productCard) return;
                
                // Получаем данные товара
                const product = {
                    id: productCard.querySelector('[product-info="name"]')?.textContent.trim() || 
                         productCard.getAttribute('data-title') || 
                         Date.now().toString(),
                    name: productCard.querySelector('[product-info="name"]')?.textContent.trim() || 
                          'Товар',
                    price: parseInt(productCard.querySelector('[product-info="cost"]')?.textContent) || 0,
                    image: productCard.querySelector('[product-info="img"] img')?.src || '',
                    size: productCard.querySelector('[product-info="size"] [checked]')?.value || 'default'
                };
                
                addToCart(product);
                e.preventDefault();
            }
        });

        // 2. Кнопки +/- и удаления в корзине
        document.addEventListener('click', function(e) {
            // Кнопка минус
            if (e.target.closest('.minus-btn')) {
                const btn = e.target.closest('.minus-btn');
                const id = btn.getAttribute('data-id');
                const size = btn.getAttribute('data-size') || 'default';
                const item = findInCart(id, size);
                
                if (item) {
                    updateQuantity(id, item.quantity - 1, size);
                }
            }
            
            // Кнопка плюс
            if (e.target.closest('.plus-btn')) {
                const btn = e.target.closest('.plus-btn');
                const id = btn.getAttribute('data-id');
                const size = btn.getAttribute('data-size') || 'default';
                const item = findInCart(id, size);
                
                if (item) {
                    updateQuantity(id, item.quantity + 1, size);
                }
            }
            
            // Кнопка удаления (крестик)
            if (e.target.closest('.remove-btn')) {
                const btn = e.target.closest('.remove-btn');
                const id = btn.getAttribute('data-id');
                const size = btn.getAttribute('data-size') || 'default';
                
                removeFromCart(id, size);
            }
            
            // Кнопка "Очистить"
            if (e.target.closest('[cart-action="remove-all"]')) {
                clearCart();
            }
        });

        // 3. Обработка формы заказа
        const orderForm = document.querySelector('.order-form form');
        if (orderForm) {
            orderForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                if (cart.length === 0) {
                    showNotification('Корзина пуста!');
                    return;
                }
                
                // Собираем данные формы
                const formData = {
                    name: document.getElementById('i8bde0eyx_0')?.value.trim() || '',
                    phone: document.getElementById('i16o32fi4_0')?.value.trim() || '',
                    zip: document.getElementById('ibaddsdm6_0')?.value.trim() || '',
                    address: document.getElementById('iywyo9upr_0')?.value.trim() || '',
                    email: document.getElementById('is3dea6yw_0')?.value.trim() || ''
                };
                
                // Показываем загрузку
                const submitBtn = orderForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span class="text-block-wrap-div">Отправка...</span>';
                submitBtn.disabled = true;
                
                try {
                    // Отправляем заказ
                    const success = await submitOrderForm(formData);
                    
                    if (success) {
                        // Показываем успех
                        const successState = document.querySelector('.form__state-success');
                        const errorState = document.querySelector('.form__state-error');
                        if (successState && errorState) {
                            orderForm.style.display = 'none';
                            successState.style.display = 'block';
                            errorState.style.display = 'none';
                            
                            // Закрываем попап через 3 секунды
                            setTimeout(() => {
                                const popupWrap = document.getElementById('ior01i51l_0');
                                if (popupWrap) {
                                    popupWrap.classList.remove('is-open');
                                    document.body.classList.remove('popup-open');
                                }
                            }, 3000);
                        }
                    } else {
                        const errorState = document.querySelector('.form__state-error');
                        if (errorState) {
                            errorState.style.display = 'block';
                        }
                    }
                } catch (error) {
                    console.error('Ошибка заказа:', error);
                    const errorState = document.querySelector('.form__state-error');
                    if (errorState) {
                        errorState.style.display = 'block';
                    }
                } finally {
                    // Восстанавливаем кнопку
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        // Загружаем корзину
        cart = loadCart();
        
        // Создаём счётчик на иконке
        updateCartIcon();
        
        // Рендерим корзину (если мы на странице cart.html)
        if (document.querySelector('.cart-list')) {
            renderCart();
        }
        
        // Настраиваем обработчики
        setupEventListeners();
        
        console.log('✅ Корзина инициализирована. Товаров:', cart.length);
        console.log('Для отладки используйте:');
        console.log('  • Cart.clear() - очистить корзину');
        console.log('  • Cart.getItems() - просмотреть содержимое');
        console.log('  • Cart.getTotal() - получить сумму');
    }

    // Запускаем при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ==================== ЭКСПОРТ ДЛЯ ГЛОБАЛЬНОГО ИСПОЛЬЗОВАНИЯ ====================
    window.Cart = {
        add: addToCart,
        remove: removeFromCart,
        update: updateQuantity,
        clear: clearCart,
        getItems: () => [...cart],
        getTotal: getTotalPrice,
        getCount: () => cart.reduce((sum, item) => sum + item.quantity, 0)
    };

})();