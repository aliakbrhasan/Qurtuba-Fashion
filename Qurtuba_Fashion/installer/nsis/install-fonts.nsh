!include "FileFunc.nsh"
!include "LogicLib.nsh"

!macro customInstall
  MessageBox MB_YESNO|MB_ICONQUESTION "Do you want to install the app fonts system-wide?" IDYES +2 IDNO +5

  UserInfo::GetAccountType
  Pop $0
  StrCmp $0 "Admin" 0 +4

  SetOutPath "$FONTS"
  IfFileExists "$INSTDIR\fonts\Cairo-Regular.ttf" 0 +2
  File "$INSTDIR\fonts\Cairo-Regular.ttf"
  IfFileExists "$INSTDIR\fonts\Cairo-Bold.ttf" 0 +2
  File "$INSTDIR\fonts\Cairo-Bold.ttf"

  IfFileExists "$FONTS\Cairo-Regular.ttf" 0 +2
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Cairo (TrueType)" "Cairo-Regular.ttf"
  IfFileExists "$FONTS\Cairo-Bold.ttf" 0 +2
  WriteRegStr HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Cairo Bold (TrueType)" "Cairo-Bold.ttf"

  IfFileExists "$FONTS\Cairo-Regular.ttf" 0 +2
  System::Call 'gdi32::AddFontResourceW(w "$FONTS\Cairo-Regular.ttf") i .r1'
  IfFileExists "$FONTS\Cairo-Bold.ttf" 0 +2
  System::Call 'gdi32::AddFontResourceW(w "$FONTS\Cairo-Bold.ttf") i .r2'
  System::Call 'user32::SendMessageTimeoutW(p 0xffff, i ${WM_FONTCHANGE}, p 0, p 0, i 0, i 1000, *i .r3)'

  Goto +3
  DetailPrint "Skipping system-wide font install (no admin or user declined)."
!macroend

!macro customUnInstall
  DeleteRegValue HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Cairo (TrueType)"
  DeleteRegValue HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts" "Cairo Bold (TrueType)"
!macroend


