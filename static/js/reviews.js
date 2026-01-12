let rating = 1;
const stars = document.querySelectorAll("#star-rating .star");

stars.forEach(star => {
    star.addEventListener("click", () => {
        rating = parseInt(star.dataset.value);
        stars.forEach(s => s.classList.toggle("full", parseInt(s.dataset.value) <= rating));
    });
});

async function fetchReviews() {
    const res = await fetch("/api/reviews");
    const reviews = await res.json();
    const container = document.getElementById("reviews-list");
    container.innerHTML = reviews.map(r => `
        <div class="news-card">
            <div class="news-head">${r.name || r.username} - ${r.rating}★</div>
            <div class="news-text">${r.text}</div>
        </div>
    `).join("");
}

document.getElementById("submit-review").addEventListener("click", async () => {
    const text = document.getElementById("review-text").value;
    if (!text) return alert("Напишите текст отзыва!");
    const res = await fetch("/api/review", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({rating, text})
    });
    const data = await res.json();
    if (data.error) return alert(data.error);
    alert("Отзыв отправлен!");
    fetchReviews();
});

fetchReviews();
