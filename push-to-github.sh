#!/bin/bash
echo "Pushing latest code to GitHub..."
git push https://$GITHUB_PERSONAL_ACCESS_TOKEN_NEW@github.com/pbm008655-sketch/Nu-Melodic-App.git main
echo "Done! You can now trigger a new build on Codemagic."
