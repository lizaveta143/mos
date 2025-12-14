const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ==================== НАСТРОЙКА YANDEX ====================
const emailConfig = {
    host: 'smtp.yandex.ru',
    port: 587,
    secure: false,
    auth: {
        user: '@yandex.ru',
        pass: ''
    },
    tls: {
        rejectUnauthorized: false
    }
};

const transporter = nodemailer.createTransport(emailConfig);

transporter.verify(function(error, success) {
    if (error) {
        console.log('❌ Ошибка подключения к Yandex:', error.message);
    } else {
        console.log('✅ Yandex SMTP готов к отправке писем');
    }
});

// ==================== БАЗА ДАННЫХ ====================
const db = new sqlite3.Database('./newsletter.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('✅ Connected to SQLite database');
        
        // Создаем таблицу подписчиков
        db.run(`CREATE TABLE IF NOT EXISTS subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            source TEXT DEFAULT 'unknown',
            page TEXT DEFAULT '/',
            subscription_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            welcome_email_sent BOOLEAN DEFAULT 0
        )`, (err) => {
            if (err) console.error('Error creating subscribers table:', err);
        });
        
        // Создаем таблицу заказов
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT UNIQUE NOT NULL,
            customer_data TEXT NOT NULL,
            items_data TEXT NOT NULL,
            total INTEGER NOT NULL,
            status TEXT DEFAULT 'new',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating orders table:', err);
        });
    }
});

// ==================== ФУНКЦИИ РАССЫЛКИ ====================
async function sendWelcomeEmail(email) {
    const mailOptions = {
        from: '"MOS" <@yandex.ru>',
        to: email,
        subject: 'Добро пожаловать в нашу рассылку! 🎉 | mos',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #ba1f2d 100%; padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 28px;">Добро пожаловать в мир Магической Битвы!</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9; text-align: center;">
                    <h2 style="color: #333;">Спасибо за подписку!⚡</h2>
                    <p>Теперь вы будете первыми узнавать о новых коллекциях мерча.</p>
                </div>
                <div style="background: #333; color: white; padding: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 14px;">Магазин мерча «MOS»</p>
                    <p style="margin: 10px 0 0; font-size: 12px; opacity: 0.8;">
                        Рассылка отправлена через Яндекс Почту<br>
                        Вы получили это письмо, потому что подписались на нашем сайте
                    </p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Приветственное письмо отправлено на: ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка отправки через Яндекс:', error.message);
        return false;
    }
}

async function sendNewsletter(subject, message, subscribers) {
    const mailOptions = {
        from: '"MOS" <@yandex.ru>',
        bcc: subscribers,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ba1f2d 0%, #8b0000 100%); padding: 25px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">${subject}</h1>
                </div>
                <div style="padding: 25px; background: #f9f9f9;">
                    <div style="background: white; padding: 20px; border-radius: 8px;">
                        ${message.replace(/\n/g, '<br>')}
                    </div>
                </div>
                <div style="background: #333; color: white; padding: 15px; text-align: center;">
                    <p style="margin: 0; font-size: 13px;">Магазин мерча «MOS»</p>
                </div>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Рассылка отправлена ${subscribers.length} подписчикам`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка рассылки через Яндекс:', error.message);
        return false;
    }
}

// ==================== ОБРАБОТКА ЗАКАЗОВ ====================
async function sendOrderEmail(orderData) {
    const mailOptions = {
        from: '"MOS - Магазин мерча" <@yandex.ru>',
        to: orderData.customer.email,
        subject: `Ваш заказ №${orderData.orderId} оформлен | MOS`,
        html: generateOrderEmailHTML(orderData)
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Письмо с заказом отправлено на: ${orderData.customer.email}`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка отправки письма с заказом:', error.message);
        return false;
    }
}

function generateOrderEmailHTML(orderData) {
    let itemsHTML = '';
    orderData.items.forEach(item => {
        itemsHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">${item.name} ${item.size !== 'default' ? `(${item.size})` : ''}</td>
                <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">${item.price} ₽</td>
                <td style="padding: 10px; text-align: right;">${item.price * item.quantity} ₽</td>
            </tr>
        `;
    });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ba1f2d; color: white; padding: 20px; text-align: center; }
                .content { background: #f9f9f9; padding: 20px; }
                .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .order-table th { background: #333; color: white; padding: 10px; text-align: left; }
                .order-table td { padding: 10px; border-bottom: 1px solid #ddd; }
                .total { font-weight: bold; font-size: 18px; color: #ba1f2d; }
                .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Ваш заказ №${orderData.orderId} оформлен!</h1>
                </div>
                
                <div class="content">
                    <p>Здравствуйте, ${orderData.customer.name}!</p>
                    <p>Благодарим вас за заказ в нашем магазине мерча «MOS».</p>
                    
                    <h3>Детали заказа:</h3>
                    <table class="order-table">
                        <thead>
                            <tr>
                                <th>Товар</th>
                                <th>Кол-во</th>
                                <th>Цена</th>
                                <th>Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHTML}
                        </tbody>
                    </table>
                    
                    <div style="text-align: right; padding: 20px 0;">
                        <p class="total">Итого к оплате: ${orderData.total} ₽</p>
                    </div>
                    
                    <h3>Данные получателя:</h3>
                    <ul>
                        <li><strong>ФИО:</strong> ${orderData.customer.name}</li>
                        <li><strong>Телефон:</strong> ${orderData.customer.phone}</li>
                        <li><strong>Адрес:</strong> ${orderData.customer.zip}, ${orderData.customer.address}</li>
                        <li><strong>Email:</strong> ${orderData.customer.email}</li>
                    </ul>
                    
                    <p>Наш менеджер свяжется с вами в ближайшее время для подтверждения заказа.</p>
                    
                    <div style="margin-top: 30px; padding: 15px; background: #e8f4f8; border-radius: 5px;">
                        <p><strong>Важная информация:</strong></p>
                        <p>• Срок доставки: 3-7 рабочих дней</p>
                        <p>• Оплата: при получении или онлайн</p>
                        <p>• Вопросы: +7 (999) 500-50-50 или на сайте</p>
                    </div>
                </div>
                
                <div class="footer">
                    <p>Магазин мерча «MOS» | Адрес: Россия, Алтайский край, г. Барнаул</p>
                    <p>Режим работы: 8:00 - 16:00 (мск)</p>
                    <p>Это письмо отправлено автоматически, пожалуйста, не отвечайте на него.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// ==================== API МАРШРУТЫ ====================

// Подписка на рассылку
app.post('/subscribe', async (req, res) => {
    const { email, source = 'unknown', page = '/' } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Некорректный email адрес' });
    }

    const sql = `INSERT OR IGNORE INTO subscribers (email, source, page) VALUES (?, ?, ?)`;
    db.run(sql, [email, source, page], async function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }

        if (this.changes === 0) {
            return res.status(409).json({ error: 'Этот email уже подписан' });
        }

        console.log(`✅ New subscriber: ${email} (from: ${source})`);
        
        const emailSent = await sendWelcomeEmail(email);
        
        if (emailSent) {
            db.run(`UPDATE subscribers SET welcome_email_sent = 1 WHERE email = ?`, [email]);
        }

        res.json({ 
            success: true,
            message: 'Спасибо за подписку! Проверьте вашу почту.',
            welcomeEmailSent: emailSent
        });
    });
});

// Получение подписчиков
app.get('/subscribers', (req, res) => {
    db.all('SELECT * FROM subscribers ORDER BY subscription_date DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }
        res.json(rows);
    });
});

// Отправка рассылки
app.post('/send-newsletter', async (req, res) => {
    const { subject, message } = req.body;

    if (!subject || !message) {
        return res.status(400).json({ error: 'Укажите тему и сообщение' });
    }

    try {
        db.all('SELECT email FROM subscribers', async (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка базы данных' });
            }

            const subscribers = rows.map(row => row.email);
            
            if (subscribers.length === 0) {
                return res.status(400).json({ error: 'Нет подписчиков для рассылки' });
            }

            const result = await sendNewsletter(subject, message, subscribers);
            
            if (result) {
                res.json({ 
                    success: true,
                    message: `✅ Рассылка отправлена ${subscribers.length} подписчикам`,
                    recipients: subscribers.length
                });
            } else {
                res.status(500).json({ error: 'Ошибка отправки рассылки' });
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// API для обработки заказов
app.post('/api/order', async (req, res) => {
    try {
        const orderData = req.body;
        
        // Валидация на сервере
        if (!orderData.customer || !orderData.items || orderData.items.length === 0) {
            return res.status(400).json({ error: 'Неверные данные заказа' });
        }
        
        // Сохраняем заказ в базе данных
        const sql = `INSERT INTO orders (order_id, customer_data, items_data, total, status) VALUES (?, ?, ?, ?, ?)`;
        
        db.run(sql, [
            orderData.orderId,
            JSON.stringify(orderData.customer),
            JSON.stringify(orderData.items),
            orderData.total,
            'new'
        ], async function(err) {
            if (err) {
                console.error('Ошибка сохранения заказа:', err);
                return res.status(500).json({ error: 'Ошибка сохранения заказа' });
            }
            
            // Отправляем письмо с заказом
            const emailSent = await sendOrderEmail(orderData);
            
            if (emailSent) {
                res.json({ 
                    success: true, 
                    message: 'Заказ оформлен! Проверьте вашу почту.',
                    orderId: orderData.orderId
                });
            } else {
                res.status(500).json({ error: 'Заказ сохранен, но не удалось отправить email' });
            }
        });
        
    } catch (error) {
        console.error('Ошибка обработки заказа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение списка заказов
app.get('/api/orders', (req, res) => {
    db.all('SELECT * FROM orders ORDER BY created_at DESC', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка базы данных' });
        }
        res.json(rows);
    });
});

// ==================== СТРАНИЦЫ ====================

// Админ-панель
app.get('/admin', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Админ-панель рассылки</title>
        <style>
            body { font-family: Arial; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 0px; }
            h1 { color: #ba1f2d; }
            button { background: #ba1f2d; color: white; padding: 10px 20px; border: none; border-radius: 20px; cursor: pointer; margin: 5px; }
            button:hover { background: #000000ff; }
            .subscriber { padding: 10px; border-bottom: 1px solid #eee; }
        </style>
        <link rel="icon" href="favicon.ico" type="image/vnd.microsoft.icon">
    </head>
    <body>
        <div class="container">
            <h1>📧 Админ-панель рассылки «MOS»</h1>
            <p>Всего подписчиков: <span id="count">0</span></p>
            
            <div>
                <h3>Отправить рассылку</h3>
                <input type="text" id="subject" placeholder="Тема письма" style="width: 948px; padding: 5px;">
                <br>
                <textarea id="message" placeholder="Текст письма" style="width: 948px; height: 200px; padding: 5px;"></textarea>
                <br>
                <button onclick="sendNewsletter()">Отправить</button>
                <div id="result"></div>
            </div>
            
            <div>
                <h3>Подписчики</h3>
                <button onclick="loadSubscribers()">Обновить</button>
                <div id="subscribers"></div>
            </div>
        </div>

        <script>
            async function loadSubscribers() {
                try {
                    const response = await fetch('/subscribers');
                    const subscribers = await response.json();
                    
                    document.getElementById('count').textContent = subscribers.length;
                    
                    let html = '';
                    subscribers.forEach(sub => {
                        html += '<div class="subscriber">';
                        html += '<strong>' + sub.email + '</strong><br>';
                        html += '<small>Дата: ' + new Date(sub.subscription_date).toLocaleDateString() + '</small>';
                        html += '</div>';
                    });
                    
                    document.getElementById('subscribers').innerHTML = html;
                } catch (error) {
                    console.error('Error:', error);
                }
            }
            
            async function sendNewsletter() {
                const subject = document.getElementById('subject').value;
                const message = document.getElementById('message').value;
                
                if (!subject || !message) {
                    alert('Заполните тему и сообщение');
                    return;
                }
                
                try {
                    const response = await fetch('/send-newsletter', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ subject, message })
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        document.getElementById('result').innerHTML = '✅ ' + result.message;
                    } else {
                        document.getElementById('result').innerHTML = '❌ ' + result.error;
                    }
                } catch (error) {
                    document.getElementById('result').innerHTML = '❌ Ошибка: ' + error.message;
                }
            }
            
            // Загружаем при открытии
            loadSubscribers();
        </script>
    </body>
    </html>
    `);
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Другие страницы (статические)
app.get('/page-5', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'page-5.html'));
});

app.get('/category', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'category.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// Обработка 404
app.use((req, res) => {
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
        res.status(404).json({ error: 'Not found' });
    } else {
        res.status(404).send('Страница не найдена');
    }
});

// ==================== ЗАПУСК СЕРВЕРА ====================
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Сервер запущен на http://localhost:' + PORT);
    console.log('📧 Яндекс рассылка готова к работе');
    console.log('👨‍💼 Админка: http://localhost:' + PORT + '/admin');
    console.log('='.repeat(50));
    console.log('📋 Доступные маршруты:');
    console.log('  • GET  /            - Главная страница');
    console.log('  • GET  /admin       - Админ-панель');
    console.log('  • POST /subscribe   - Подписка на рассылку');
    console.log('  • GET  /subscribers - Список подписчиков');
    console.log('  • POST /send-newsletter - Отправка рассылки');
    console.log('  • POST /api/order   - Оформление заказа');
    console.log('  • GET  /api/orders  - Список заказов');
    console.log('='.repeat(50));
});