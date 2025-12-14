// mailing.js - простой вариант
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('iuqhj3ik7_0');
    if (!form) return;
    
    const emailInput = document.getElementById('i2vot6b6r_0');
    const successState = document.getElementById('igb7mbm4l_0');
    const errorState = document.getElementById('ibxeyoqpz_0');
    
    if (!emailInput || !successState || !errorState) return;
    
    // Скрываем состояния
    successState.style.display = 'none';
    errorState.style.display = 'none';
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // Простая валидация
        if (!email.includes('@') || !email.includes('.')) {
            showError('Введите корректный email');
            return;
        }
        
        try {
            // Показываем загрузку
            const button = form.querySelector('button[type="submit"]');
            const originalText = button.textContent;
            button.textContent = 'Отправка...';
            button.disabled = true;
            
            const response = await fetch('/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: email,
                    source: 'website',
                    page: window.location.pathname
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showSuccess();
                emailInput.value = '';
            } else {
                showError(result.error || 'Ошибка');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showError('Ошибка соединения');
        } finally {
            // Восстанавливаем кнопку
            const button = form.querySelector('button[type="submit"]');
            button.textContent = 'Отправить';
            button.disabled = false;
        }
    });
    
    function showSuccess() {
        successState.style.display = 'block';
        errorState.style.display = 'none';
        setTimeout(() => {
            successState.style.display = 'none';
        }, 5000);
    }
    
    function showError(message) {
        const errorText = errorState.querySelector('.form__text-error span');
        if (errorText) errorText.textContent = message;
        errorState.style.display = 'block';
        successState.style.display = 'none';
        setTimeout(() => {
            errorState.style.display = 'none';
        }, 5000);
    }
    
    console.log('✅ Форма рассылки готова');
});