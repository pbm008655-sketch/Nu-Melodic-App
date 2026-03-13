#!/bin/bash
echo "Pushing latest code to GitHub..."
TOKEN="$GITHUB_PERSONAL_ACCESS_TOKEN_NEW2"

# Create a temporary askpass helper
# When git asks for Username, return the token
# When git asks for Password, return empty
ASKPASS=$(mktemp /tmp/askpass.XXXXXX)
cat > "$ASKPASS" << SCRIPT
#!/bin/bash
case "\$1" in
  *Username*) echo "$TOKEN" ;;
  *Password*) echo "" ;;
  *) echo "" ;;
esac
SCRIPT
chmod +x "$ASKPASS"

GIT_ASKPASS="$ASKPASS" git push "https://github.com/pbm008655-sketch/Nu-Melodic-App.git" main 2>&1

rm -f "$ASKPASS"
echo "Done! You can now trigger a new build on Codemagic."
