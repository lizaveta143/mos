const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./newsletter.db', (err) => {
    if (err) {
        console.error('Error opening database:', err);
        return;
    }
    
    console.log('🔄 Обновляем структуру базы данных...');
    
    // Проверяем наличие колонки source
    db.all(`PRAGMA table_info(subscribers)`, (err, columns) => {
        if (err) {
            console.error('Ошибка проверки таблицы:', err);
            return;
        }
        
        const hasSourceColumn = columns.some(col => col.name === 'source');
        
        if (!hasSourceColumn) {
            console.log('➕ Добавляем колонку source...');
            db.run(`ALTER TABLE subscribers ADD COLUMN source TEXT DEFAULT 'website'`, (err) => {
                if (err) {
                    console.error('Ошибка добавления колонки:', err);
                } else {
                    console.log('✅ Колонка source добавлена успешно');
                    
                    // Обновляем существующие записи
                    db.run(`UPDATE subscribers SET source = 'homepage' WHERE source IS NULL`, (err) => {
                        if (err) {
                            console.error('Ошибка обновления записей:', err);
                        } else {
                            console.log('✅ Существующие записи обновлены');
                        }
                        db.close();
                    });
                }
            });
        } else {
            console.log('✅ Колонка source уже существует');
            db.close();
        }
    });
});