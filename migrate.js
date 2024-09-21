db = connect('mongodb://localhost/sonddr')
goals = db.getCollection('goals')

goals.replaceOne({"name": "No poverty"}, 
	{
		"name-en": "No poverty",
		"name-fr": "Pas de pauvreté",
		"icon": "home",
		"color": "#89465E",
		"order": 1,
		"header-en": "The recent pandemic pushed tens of millions into poverty worldwide and although extreme poverty (<2.15$/day) has been decreasing over the last generation, it is starting to stagnate.",
		"header-fr": "Des dizaines de millions de personnes sont tombés dans la pauvreté pendant la pandémie, et bien que la pauvreté extrême (<2.15$/jour) ait bien diminué, elle commence de nouveau à stagner."
	}
)

goals.replaceOne({"name": "Health and well-being"}, 
	{
		"name-en": "Health and well-being",
		"name-fr": "Santé et bien-être",
		"icon": "health_and_safety",
		"color": "#894646",
		"order": 2,
		"header-en": "We live in a world in which 10 children die every minute. But a significant part of these deaths, as well as many other; such as communicable diseases or substance abuse, are preventable.",
		"header-fr": "Nous vivons dans un monde au sein duquel 10 enfants meurent chaque minute. Mais une grande partie de ces morts, ainsi que d’autres, ainsi que celles des maladie contagieuses, sont évitables."
	}
)

goals.replaceOne({"name": "Reduced inequalities"},
	{
		"name-en": "Reduced inequalities",
		"name-fr": "Réduire les inégalités",
		"icon": "handshake",
		"color": "#896246",
		"order": 3,
		"header-en": "Both within and among countries, many domains such as health and education are strike by inequalities. And although global economic inequality is starting to go down, there is still a long way to go.",
		"header-fr": "Les inégalités dans des domaines comme la santé ou l'éducation sont omniprésentes, à la fois au sein et entre les pays. Et même si les grandes inégalités économiques commencent a diminuer, tout reste a faire."
	}
)

goals.replaceOne({"name": "Sustainability"},
	{
		"name-en": "Sustainability",
		"name-fr": "Développement durable",
		"icon": "recycling",
		"color": "#898246",
		"order": 4,
		"header-en": "The recent economic progress has been accompanied by waste production and natural resource consumption in all sectors of the economy at a much faster rate than either population or GDP growth.",
		"header-fr": "Les avancées économiques récentes ont produit des déchets et consommé les ressources naturelles à une allure bien supérieure à la croissance de la population ou des PIB."
	}
)

goals.replaceOne({"name": "Preserved ecosystems"},
	{
		"name-en": "Preserved ecosystems",
		"name-fr": "Préserver les écosystèmes",
		"icon": "eco",
		"color": "#4B8946",
		"order": 5,
		"header-en": "The current human-caused climate change has devastating impacts on biodiversity. The current rate of extinction of species is a thousand times too high: we already are in a 6th extinction event.",
		"header-fr": "Le changement climatique a un impact catastrophique sur la biodiversité. Le rythme d’extinction des espèces est un millier de fois trop rapide: nous sommes dans une 6ème extinction de masse."
	}
)

goals.replaceOne({"name": "Peace and justice"},
	{
		"name-en": "Peace and justice",
		"name-fr": "Paix et justice",
		"icon": "balance",
		"color": "#468981",
		"order": 6,
		"header-en": "2022 witnessed an unprecedented 50% increase in conflict-related civilian deaths. In the meantime, violence and corruption runs rampant in a justice that is often too slow or malfunctioning.",
		"header-fr": "2022 a été marquée par une hausse sans précédent du nombre de victimes civiles lors de conflits. Et dans le même temps, corruption et violence sont monnaie courantes dans les systèmes judiciaires."
	}
)

goals.replaceOne({"name": "Decent work"},
	{
		"name-en": "Decent work",
		"name-fr": "Travail décent",
		"icon": "work",
		"color": "#464D89",
		"order": 7,
		"header-en": "In too many places, having a job does not guarantee the ability to escape from poverty. And even when it does, a lot more work is still needed to do to achieve a sustained and sustainable workplace.",
		"header-fr": "Souvent, avoir un emploi ne garantit pas d'être a l’abri de la pauvreté. Et même quand c'est le cas, il reste bien du chemin à parcourir pour arriver à des lieux de travail sains et durables."
	}
)

goals.replaceOne({"name": "Quality education"},
	{
		"name-en": "Quality education",
		"name-fr": "Éducation de qualité",
		"icon": "school",
		"color": "#684689",
		"order": 8,
		"header-en": "Getting a proper education has been proven to be one of the most powerful vehicles for development, and although primary and secondary school completion rates are rising, the pace is slow and uneven.",
		"header-fr": "C'est démontré, une éducation de qualité est un des meilleurs tremplins pour le développement. Et même si la tendance dans le primaire et le secondaire est a la hausse, elle demeure faible et instable."
	}
)
