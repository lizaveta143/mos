const sqlite3 = require('sqlite3').verbose();

console.log('🔍 Проверка базы данных...');

const db = new sqlite3.Database('./newsletter.db', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.log('❌ База данных не найдена или повреждена');
        console.log('💡 Создайте новую базу запустив сервер: node server.js');
        return;
    }
    
    console.log('✅ База данных найдена');
    
    // Проверяем таблицы
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.log('❌ Ошибка чтения таблиц:', err.message);
            db.close();
            return;
        }
        
        console.log('📊 Таблицы в базе:');
        tables.forEach(table => console.log('  -', table.name));
        
        // Проверяем подписчиков
        db.all('SELECT * FROM subscribers', (err, rows) => {
            if (err) {
                console.log('❌ Ошибка чтения подписчиков:', err.message);
            } else {
                console.log(`\n👥 Подписчиков в базе: ${rows.length}`);
                rows.forEach((row, i) => {
                    console.log(`  ${i+1}. ${row.email} (${new Date(row.subscription_date).toLocaleDateString()})`);
                });
            }
            
            // Статистика
            db.get('SELECT COUNT(*) as total FROM subscribers', (err, row) => {
                console.log(`\n📈 Всего подписчиков: ${row.total}`);
                
                db.get('SELECT COUNT(*) as sent FROM subscribers WHERE welcome_email_sent = 1', (err, row) => {
                    console.log(`📨 Писем отправлено: ${row.sent}`);
                    db.close();
                });
            });
        });
    });
});