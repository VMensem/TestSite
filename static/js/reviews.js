document.addEventListener("DOMContentLoaded", () => {
    const stars = document.querySelectorAll(".star-rating .star");
    let rating = 1;

    stars.forEach(star => {
        star.addEventListener("click", () => {
            rating = parseInt(star.dataset.value);
            stars.forEach(s => {
                if (parseInt(s.dataset.value) <= rating) {
                    s.classList.add("active");
                    s.style.color = "#ff1a3c";
                    s.style.transition = "0.3s";
                } else {
                    s.classList.remove("active");
                    s.style.color = "#ffffff55";
                }
            });
        });
    });

    const reviewForm = document.getElementById("review-form");
    const reviewText = document.getElementById("review-text");
    const submitBtn = document.getElementById("submit-review");
    const reviewMsg = document.getElementById("review-msg");
    const reviewsList = document.getElementById("reviews-list");

    // Функция подгрузки отзывов
    async function loadReviews() {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        reviewsList.innerHTML = "";
        data.forEach(r => {
            const div = document.createElement("div");
            div.className = "news-card reveal";
            div.innerHTML = `
                <div class="mini-top">
                    <img src="${r.avatar || 'https://via.placeholder.com/64'}" />
                    <div style="margin-left:10px;">
                        <div style="font-weight:600;color:#fff;">${r.name || r.username}</div>
                        <div style="font-size:0.8rem;color:#aaa;">${new Date(r.time).toLocaleString()}</div>
                    </div>
                </div>
                <div class="mini-desc" style="margin-top:10px;">
                    ${"⭐".repeat(r.rating)}${"☆".repeat(5-r.rating)}
                    <p style="margin-top:5px;">${r.text}</p>
                </div>
            `;
            reviewsList.appendChild(div);
        });
    }

    loadReviews();

    // Проверка авторизации через Telegram
    window.onTelegramAuth = function(user) {
        console.log("Авторизован:", user);
        reviewForm.style.display = "block";
    }

    // Отправка отзыва
    submitBtn.addEventListener("click", async () => {
        const text = reviewText.value.trim();
        if (!text) {
            reviewMsg.textContent = "Введите текст отзыва";
            return;
        }

        const res = await fetch("/api/review", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating, text })
        });
        const data = await res.json();
        if (data.status === "ok") {
            reviewMsg.style.color = "#0f0";
            reviewMsg.textContent = "Отзыв отправлен!";
            reviewText.value = "";
            rating = 1;
            stars.forEach((s,i) => {
                s.classList.toggle("active", i===0);
                s.style.color = i===0 ? "#ff1a3c" : "#ffffff55";
            });
            loadReviews();
        } else {
            reviewMsg.style.color = "#ff1a3c";
            reviewMsg.textContent = data.error || "Ошибка отправки";
        }
    });
});