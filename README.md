# 카드 뒤집기 기억력 게임

네온 감성의 웹 카드 매칭 게임입니다. 난이도 선택, 이동/시간 추적, 최고 기록 저장 기능을 제공합니다.

## GitHub Pages에 배포하기
1. GitHub에 새 저장소를 만들고 이 프로젝트 파일들을 모두 추가합니다.
2. 아래 명령으로 커밋하고 원격 저장소에 푸시합니다.
   ```bash
   git add .
   git commit -m "Deploy memory game"
   git branch -M main
   git remote add origin https://github.com/<사용자>/<저장소>.git
   git push -u origin main
   ```
3. GitHub 저장소의 **Settings → Pages**에서 **Deploy from a branch**를 선택하고 `main` 브랜치의 `/ (root)`를 지정합니다.
4. 잠시 후 `https://<사용자>.github.io/<저장소>/`에서 게임을 즐길 수 있습니다.

## 개발 서버 실행
정적 사이트라 별도 빌드 과정이 필요 없습니다. 간단한 로컬 서버로 미리보기 하려면 다음과 같이 실행하세요.
```bash
npx serve .
```
또는 VS Code의 Live Server 확장 등을 사용할 수 있습니다.

## 라이선스
프로젝트 사용에 대한 제한을 두지 않습니다. 자유롭게 수정하고 배포하세요.
