if [ -z "$1" ]; then

	echo "Usage: manage.sh [run|exec]"
	echo " "
	echo "run    start the application"
	echo "exec   open a shell inside the container"
	exit 0
fi
case $1 in
	build)
		docker build . -t jekyll-ghpages
		;;
	run)
		echo "Open the site in your browser at http://localhost:4000/gesea-eu/"
		echo ""
		docker run --rm -ti --name gesea-eu -p 4000:4000 -v $PWD:/srv/jekyll -e PAGES_REPO_NWO=esgebel/gesea-eu jekyll-ghpages github-pages build -s /srv/jekyll/
		docker run --rm -ti --name gesea-eu -p 4000:4000 -v $PWD:/srv/jekyll -e PAGES_REPO_NWO=esgebel/gesea-eu jekyll-ghpages jekyll serve -H 0.0.0.0 -s /srv/jekyll/ --skip-initial-build --no-watch
		;;
	refresh)
		docker exec -ti gesea-eu github-pages build -s /srv/jekyll/
		;;
	exec)
		docker run --rm -ti -v $PWD:/srv/jekyll jekyll-ghpages bash
		;;
	*)
		echo "Wrong argument"
		;;
esac

