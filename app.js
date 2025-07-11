// Форма
document.getElementById('bookingForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const data = {
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    service: document.getElementById('service').value,
    master: document.getElementById('master').value,
    datetime: document.getElementById('datetime').value,
    price: calculatePrice(
      document.getElementById('service').value,
      document.getElementById('master').value
    )
  };

  if (!data.name || !data.phone || !data.service || !data.master || !data.datetime) {
    const messageDiv = document.getElementById('successMessage');
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Пожалуйста, заполните все поля.';
    return;
  }

  const response = await fetch('/api/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const messageDiv = document.getElementById('successMessage');

  if (response.ok) {
    messageDiv.style.color = 'green';
    messageDiv.textContent = 'Вы успешно записались!';
    this.reset();
    document.getElementById('priceDisplay').textContent = 'Цена: не указана';

    // Обновляем таблицу записей
    if (typeof loadBookings === 'function') {
      loadBookings();
    }
  } else {
    messageDiv.style.color = 'red';
    messageDiv.textContent = 'Ошибка при записи.';
  }
});

// --- Расчёт цены ---
const basePrices = {
  'Стрижка': 500,
  'Бритьё': 300,
  'Усы': 200,
  'Мытье головы': 150
};

const topMasters = ['Михаил', 'Анастасия'];
const priceMultiplier = 1.5;

function calculatePrice(service, master) {
  let price = basePrices[service] || 0;
  if (topMasters.includes(master)) {
    price = Math.round(price * priceMultiplier);
  }
  return price;
}

function updatePrice() {
  const service = document.getElementById('service').value;
  const master = document.getElementById('master').value;
  const priceDisplay = document.getElementById('priceDisplay');

  if (!service || !master) {
    priceDisplay.textContent = 'Цена: не указана';
    return;
  }

  const price = calculatePrice(service, master);
  priceDisplay.textContent = `Цена: ${price} руб.`;
}

// События изменения
document.getElementById('service').addEventListener('change', updatePrice);
document.getElementById('master').addEventListener('change', updatePrice);