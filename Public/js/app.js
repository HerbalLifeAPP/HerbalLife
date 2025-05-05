const menuIcon = document.querySelector(".menu-icon");
const sideMenu = document.querySelector(".side-menu");
const closeIcon = document.querySelector("#close-btn");
const passwordInput = document.querySelector("#password");
const showPasswordbtn = document.querySelector("#toggle-btn-one");
const showPasswordIcon = document.querySelector("#toggleIcon1");
const errorMessage = document.querySelector("#error-message");

// Sign up error message fade out
if (errorMessage) {
  setTimeout(() => {
    errorMessage.style.transition = "opacity o.5s ease-out";
    errorMessage.style.opacity = "0";
    setTimeout(() => {
      errorMessage.remove(); // Remove errorMessage from the DOM
    }, 500);
  }, 3000);
}

// Open the side menu
menuIcon.addEventListener("click", () => {
  sideMenu.classList.add("active");
});

// Close the side menu
closeIcon.addEventListener("click", () => {
  sideMenu.classList.remove("active");
});