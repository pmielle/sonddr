document.addEventListener("DOMContentLoaded", function(_) {

	// text translation
	let content
	let button
	if (navigator.language.split("-")[0] == "fr") {
		content = "Sonddr est un endroit où partager et réaliser nos idées pour rendre le monde (un peu) meilleur"
		button = "Se connecter avec"
	} else {
		content = "Sonddr is a place to share and contribute to each other ideas to make the world a little (or a lot) better"
		button = "Log in with"
	}
	document.getElementById("my-title").textContent = content
	document.getElementById("my-button").textContent = button

	// show dev inputs if needed
	console.log(window.location.host);

})


