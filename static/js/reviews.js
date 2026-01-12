let rating = 1; // начальная оценка
const stars = document.querySelectorAll(".star");
const reviewForm = document.getElementById("review-form");
const reviewsList = document.getElementById("reviews-list");

// Звёзды
stars.forEach(star => {
    star.addEventListener("click", () => {
        rating = parseInt(star.dataset.value);
        updateStars();
    });
});

function updateStars() {
    stars.forEach(star => {
        if (parseInt(star.dataset.value) <= rating) {
            star.classList.add("full");
        } else {
            star.classList.remove("full");
        }
    });
}

// Загрузка отзывов
async function loadReviews() {
    const res = await fetch("/api/reviews");
    const data = await res.json();
    reviewsList.innerHTML = "";
    data.forEach(r => {
        const div = document.createElement("div");
        div.className = "review";
        div.innerHTML = `
            <div class="user">
                <img src="${r.avatar}" alt="avatar">
                <strong>${r.name || r.username}</strong>
            </div>
            <div class="stars">
                ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}
            </div>
            <p>${r.text}</p>
        `;
        reviewsList.appendChild(div);
    });
}

// Отправка отзыва
document.getElementById("submit-review").addEventListener("click", async () => {
    const text = document.getElementById("review-text").value;
    if (!text) return alert("Напишите отзыв!");
    const res = await fetch("/api/review", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({rating, text})
    });
    const data = await res.json();
    if (data.status === "ok") {
        document.getElementById("review-text").value = "";
        rating = 1;
        updateStars();
        loadReviews();
    } else {
        alert(data.error || "Ошибка");
    }
});

// Telegram авторизация
window.TelegramLoginWidget && (window.TelegramLoginWidget = {
    onAuth: () => {
        reviewForm.style.display = "block";
    }
});

// Инициализация
loadReviews();
updateStars();