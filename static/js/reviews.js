let rating = 1;

const tgLoginBtn = document.getElementById("tg-login-btn");
const reviewForm = document.getElementById("review-form");
const stars = document.querySelectorAll(".star");
const submitBtn = document.getElementById("submit-review");
const reviewText = document.getElementById("review-text");
const reviewsContainer = document.getElementById("reviews-container");

tgLoginBtn.addEventListener("click", () => {
    // Здесь нужно заменить на реальный Telegram Login
    fetch("/api/auth/telegram", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            id: Date.now(),
            first_name: "Vlad",
            username: "VladMensem",
            photo_url: "https://placekitten.com/50/50"
        })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === "ok") {
            tgLoginBtn.style.display = "none";
            reviewForm.classList.remove("hidden");
        }
    });
});

stars.forEach(star => {
    star.addEventListener("click", () => {
        rating = parseInt(star.dataset.rating);
        stars.forEach(s => s.classList.remove("full"));
        stars.forEach(s => {
            if(parseInt(s.dataset.rating) <= rating) s.classList.add("full");
        });
    });
});

submitBtn.addEventListener("click", () => {
    const text = reviewText.value.trim();
    if(!text) return alert("Введите отзыв!");
    fetch("/api/review", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({rating, text})
    }).then(res => res.json())
    .then(data => {
        if(data.status === "ok") {
            reviewText.value = "";
            rating = 1;
            stars.forEach(s => s.classList.remove("full"));
            stars[0].classList.add("full");
            loadReviews();
        } else alert(data.error);
    });
});

function loadReviews() {
    fetch("/api/reviews")
    .then(res => res.json())
    .then(data => {
        reviewsContainer.innerHTML = "";
        data.forEach(r => {
            const div = document.createElement("div");
            div.className = "review";
            div.innerHTML = `
                <img src="${r.avatar}" class="avatar"/>
                <b>${r.name || r.username}</b>
                <span>${"★".repeat(r.rating) + "☆".repeat(5-r.rating)}</span>
                <p>${r.text}</p>
            `;
            reviewsContainer.appendChild(div);
        });
    });
}

loadReviews();