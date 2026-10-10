import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const ROAD_WIDTH = Math.min(width - 30, 390);
const ROAD_LEFT = (width - ROAD_WIDTH) / 2;
const CAR_WIDTH = 48;
const CAR_HEIGHT = 78;

const LANES = [
  ROAD_LEFT + ROAD_WIDTH * 0.2 - CAR_WIDTH / 2,
  ROAD_LEFT + ROAD_WIDTH * 0.5 - CAR_WIDTH / 2,
  ROAD_LEFT + ROAD_WIDTH * 0.8 - CAR_WIDTH / 2,
];

type Enemy = {
  lane: number;
  y: number;
  color: string;
};

export default function RaazHighwayRush() {
  const [carLane, setCarLane] = useState(1);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(7);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const gameLoop = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnCounter = useRef(0);

  const startGame = () => {
    setCarLane(1);
    setEnemies([]);
    setScore(0);
    setSpeed(7);
    setGameOver(false);
    setStarted(true);
    spawnCounter.current = 0;
  };

  const moveLeft = () => {
    if (!started || gameOver) return;
    setCarLane((lane) => Math.max(0, lane - 1));
  };

  const moveRight = () => {
    if (!started || gameOver) return;
    setCarLane((lane) => Math.min(2, lane + 1));
  };

  useEffect(() => {
    if (!started || gameOver) return;

    gameLoop.current = setInterval(() => {
      spawnCounter.current += 1;

      setEnemies((currentEnemies) => {
        let nextEnemies = currentEnemies
          .map((enemy) => ({
            ...enemy,
            y: enemy.y + speed,
          }))
          .filter((enemy) => enemy.y < height);

        if (spawnCounter.current % 28 === 0) {
          const lane = Math.floor(Math.random() * 3);
          const colors = ["#DC2626", "#F59E0B", "#8B5CF6", "#16A34A", "#EC4899"];

          nextEnemies.push({
            lane,
            y: -100,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }

        const playerX = LANES[carLane];

        const collision = nextEnemies.some((enemy) => {
          const enemyX = LANES[enemy.lane];
          const horizontal = Math.abs(enemyX - playerX) < CAR_WIDTH - 8;
          const vertical = enemy.y > height - 210 && enemy.y < height - 90;
          return horizontal && vertical;
        });

        if (collision) {
          setGameOver(true);
          setStarted(false);
        }

        return nextEnemies;
      });

      setScore((value) => value + 1);
      setSpeed((value) => Math.min(15, value + 0.015));
    }, 50);

    return () => {
      if (gameLoop.current) {
        clearInterval(gameLoop.current);
      }
    };
  }, [started, gameOver, carLane, speed]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View>
          <Text style={styles.logo}>SMILEYX</Text>
          <Text style={styles.subtitle}>PLAYTOGETHER • HIGHWAY RUSH</Text>
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.score}>{Math.floor(score / 10)}</Text>
        </View>
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        <View style={styles.road}>
          <View style={styles.sideLineLeft} />
          <View style={styles.sideLineRight} />

          <View style={[styles.laneLine, { left: ROAD_WIDTH / 3 }]} />
          <View style={[styles.laneLine, { left: (ROAD_WIDTH / 3) * 2 }]} />

          {enemies.map((enemy, index) => (
            <View
              key={`${enemy.lane}-${index}`}
              style={[
                styles.enemyCar,
                {
                  left: LANES[enemy.lane] - ROAD_LEFT,
                  top: enemy.y,
                  backgroundColor: enemy.color,
                },
              ]}
            >
              <View style={styles.enemyWindow} />
            </View>
          ))}

          {/* Saffron Player Car */}
          <Animated.View
            style={[
              styles.playerCar,
              { left: LANES[carLane] - ROAD_LEFT },
            ]}
          >
            <View style={styles.windshield} />
            <View style={styles.carStripe} />
            <View style={styles.headLightLeft} />
            <View style={styles.headLightRight} />
          </Animated.View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          onPress={moveLeft}
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlPressed,
          ]}
        >
          <Text style={styles.controlText}>‹</Text>
        </Pressable>

        {!started || gameOver ? (
          <Pressable
            onPress={startGame}
            style={({ pressed }) => [
              styles.startButton,
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text style={styles.startText}>
              {gameOver ? "RACE AGAIN" : "START RACE"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.speedBox}>
            <Text style={styles.speedText}>
              {Math.round(speed * 10)} KM/H
            </Text>
          </View>
        )}

        <Pressable
          onPress={moveRight}
          style={({ pressed }) => [
            styles.controlButton,
            pressed && styles.controlPressed,
          ]}
        >
          <Text style={styles.controlText}>›</Text>
        </Pressable>
      </View>

      {/* Game Over Modal */}
      {gameOver && (
        <View style={styles.gameOverOverlay}>
          <View style={styles.gameOverCard}>
            <Text style={styles.gameOverEmoji}>💥</Text>
            <Text style={styles.gameOverTitle}>CRASHED!</Text>
            <Text style={styles.finalScore}>
              Final Score: {Math.floor(score / 10)}
            </Text>
            <Pressable onPress={startGame} style={styles.restartButton}>
              <Text style={styles.restartText}>PLAY AGAIN</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#161311",
  },
  header: {
    height: 90,
    paddingHorizontal: 20,
    paddingTop: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    padding: 6,
  },
  logo: {
    color: "#FF7A00",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  subtitle: {
    color: "#A3978C",
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 2,
    textAlign: "center",
  },
  scoreBox: {
    alignItems: "flex-end",
  },
  scoreLabel: {
    color: "#A3978C",
    fontSize: 9,
    letterSpacing: 1,
  },
  score: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
  },
  gameArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  road: {
    width: ROAD_WIDTH,
    height: "100%",
    maxHeight: 560,
    backgroundColor: "#241F1A",
    overflow: "hidden",
    borderRadius: 18,
    position: "relative",
  },
  sideLineLeft: {
    position: "absolute",
    left: 7,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#FF7A00",
  },
  sideLineRight: {
    position: "absolute",
    right: 7,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#FF7A00",
  },
  laneLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#423932",
    opacity: 0.7,
  },
  playerCar: {
    position: "absolute",
    bottom: 35,
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    borderRadius: 12,
    backgroundColor: "#FF7A00",
    borderWidth: 2,
    borderColor: "#FFB066",
    zIndex: 10,
  },
  windshield: {
    position: "absolute",
    top: 9,
    left: 7,
    right: 7,
    height: 23,
    borderRadius: 7,
    backgroundColor: "#2B1E13",
  },
  carStripe: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 4,
    left: 20,
    backgroundColor: "#FFFFFF",
    opacity: 0.7,
  },
  headLightLeft: {
    position: "absolute",
    bottom: 6,
    left: 7,
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  headLightRight: {
    position: "absolute",
    bottom: 6,
    right: 7,
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  enemyCar: {
    position: "absolute",
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  enemyWindow: {
    position: "absolute",
    top: 9,
    left: 7,
    right: 7,
    height: 23,
    borderRadius: 7,
    backgroundColor: "#172333",
  },
  controls: {
    height: 95,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  controlButton: {
    width: 65,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#2E2721",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4A3F35",
  },
  controlPressed: {
    backgroundColor: "#4A3F35",
  },
  controlText: {
    color: "#fff",
    fontSize: 40,
    lineHeight: 44,
  },
  startButton: {
    height: 56,
    paddingHorizontal: 25,
    borderRadius: 18,
    backgroundColor: "#FF7A00",
    justifyContent: "center",
    alignItems: "center",
  },
  startText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  speedBox: {
    height: 56,
    minWidth: 120,
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: "#2E2721",
    justifyContent: "center",
    alignItems: "center",
  },
  speedText: {
    color: "#FF7A00",
    fontWeight: "800",
    fontSize: 12,
  },
  gameOverOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 90,
    bottom: 105,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  gameOverCard: {
    width: 270,
    padding: 26,
    borderRadius: 24,
    backgroundColor: "#241F1A",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4A3F35",
  },
  gameOverEmoji: {
    fontSize: 44,
  },
  gameOverTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 5,
  },
  finalScore: {
    color: "#FF7A00",
    fontSize: 16,
    fontWeight: "700",
    marginVertical: 12,
  },
  restartButton: {
    backgroundColor: "#FF7A00",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  restartText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
});