import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import ConfigScreen from './screens/ConfigScreen'
import RoundScreen from './screens/RoundScreen'
import QuestionScreen from './screens/QuestionScreen'
import RoundEndScreen from './screens/RoundEndScreen'
import FinalRoundScreen from './screens/FinalRoundScreen'
import FinalQuestionScreen from './screens/FinalQuestionScreen'
import FinalResultsScreen from './screens/FinalResultsScreen'
import AnalyticsScreen from './screens/AnalyticsScreen'
import HostScreen from './screens/HostScreen'
import GameTrailerScreen from './screens/GameTrailerScreen'

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ConfigScreen />} />
          <Route path="/game-trailer/:roundNumber" element={<GameTrailerScreen />} />
          <Route path="/round/:roundNumber" element={<RoundScreen />} />
          <Route path="/question/:roundNumber/:topicIndex/:valueIndex" element={<QuestionScreen />} />
          <Route path="/round-end/:roundNumber" element={<RoundEndScreen />} />
          <Route path="/final" element={<FinalRoundScreen />} />
          <Route path="/final/question" element={<FinalQuestionScreen />} />
          <Route path="/final/results" element={<FinalResultsScreen />} />
          <Route path="/analytics" element={<AnalyticsScreen />} />
          <Route path="/host/:gameId" element={<HostScreen />} />
          <Route path="/host" element={<HostScreen />} />
        </Routes>
      </BrowserRouter>
    </GameProvider>
  )
}

export default App

