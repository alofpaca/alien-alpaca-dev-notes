const PATH_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*(\/[A-Za-z_][A-Za-z0-9_]*)*$/;
const PRESS_KINDS = new Set(["SUCCESS", "INVALID"]);
const PATH_LABELS = {
  buttonPath: "Buttonのパス",
  focusFeedbackPath: "選択フィードバックのパス",
  pressFeedbackPath: "押下フィードバックのパス",
  audioPlayerPath: "AudioStreamPlayerのパス",
};
const CONFIG_KEYS = new Set([
  "buttonPath",
  "focusFeedbackPath",
  "pressFeedbackPath",
  "audioPlayerPath",
  "pressKind",
  "reducedMotionDefault",
]);

export const defaultConfig = Object.freeze({
  buttonPath: "UIButton",
  focusFeedbackPath: "UIButton/FocusFeedback",
  pressFeedbackPath: "UIButton/PressFeedback",
  audioPlayerPath: "UIAudio",
  pressKind: "SUCCESS",
  reducedMotionDefault: false,
});

/**
 * Validate and normalize generator input without mutating it.
 *
 * Node paths deliberately accept only simple relative Godot `$Node/Child`
 * paths. Rejecting punctuation, whitespace and traversal keeps generated
 * source syntactically inert instead of trying to escape arbitrary text.
 */
export function validateConfig(config = {}) {
  const errors = [];
  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    return ["設定はオブジェクトで指定してください。"];
  }

  for (const key of Object.keys(config)) {
    if (!CONFIG_KEYS.has(key)) errors.push(`不明な設定項目です: ${key}`);
  }

  const value = { ...defaultConfig, ...config };
  for (const key of ["buttonPath", "focusFeedbackPath", "pressFeedbackPath", "audioPlayerPath"]) {
    if (typeof value[key] !== "string" || !PATH_PATTERN.test(value[key])) {
      errors.push(`${PATH_LABELS[key]}は安全な相対Godotノードパスで指定してください。`);
    }
  }

  if (value.focusFeedbackPath === value.pressFeedbackPath) {
    errors.push("focusFeedbackPath と pressFeedbackPath は別のノードにしてください。");
  }
  if (!PRESS_KINDS.has(value.pressKind)) {
    errors.push("pressKind は SUCCESS または INVALID にしてください。");
  }
  if (typeof value.reducedMotionDefault !== "boolean") {
    errors.push("reducedMotionDefault は真偽値で指定してください。");
  }

  return errors;
}

/** Generate a self-contained Godot 4.7.2 wiring script. */
export function generateWiring(config = {}) {
  const errors = validateConfig(config);
  if (errors.length) throw new TypeError(errors.join(" "));
  const value = { ...defaultConfig, ...config };
  const reduced = value.reducedMotionDefault ? "true" : "false";

  const code = `extends Control

@export var reduced_motion: bool = ${reduced}
@export var focus_sound: AudioStreamWAV
@export var pressed_sound: AudioStreamWAV

@onready var ui_button: Button = $${value.buttonPath}
@onready var focus_feedback: SelectionFeedback = $${value.focusFeedbackPath}
@onready var press_feedback: MenuFeedback = $${value.pressFeedbackPath}
@onready var audio_player: AudioStreamPlayer = $${value.audioPlayerPath}

func _ready() -> void:
    press_feedback.kind = MenuFeedback.Kind.${value.pressKind}
    _apply_reduced_motion()
    ui_button.focus_entered.connect(_on_focus_entered)
    ui_button.focus_exited.connect(_on_focus_exited)
    ui_button.pressed.connect(_on_pressed)

func set_reduced_motion(value: bool) -> void:
    reduced_motion = value
    _apply_reduced_motion()
    if focus_feedback.selected:
        focus_feedback.trigger()
    if press_feedback.selected:
        press_feedback.trigger()

func clear_feedback() -> void:
    focus_feedback.clear()
    press_feedback.clear()

func _apply_reduced_motion() -> void:
    focus_feedback.reduced_motion = reduced_motion
    press_feedback.reduced_motion = reduced_motion

func _on_focus_entered() -> void:
    focus_feedback.trigger()
    _play(focus_sound)

func _on_focus_exited() -> void:
    clear_feedback()

func _on_pressed() -> void:
    press_feedback.trigger()
    _play(pressed_sound)

func _play(stream: AudioStreamWAV) -> void:
    if stream == null:
        return
    audio_player.stream = stream
    audio_player.play()
`;

  const tree = `WiredButtonHost (Control / 生成スクリプト)
├─ Button: $${value.buttonPath}
├─ FocusFeedback: $${value.focusFeedbackPath} (selection_feedback.gd / Full Rect)
├─ PressFeedback: $${value.pressFeedbackPath} (menu_feedback.gd / ${value.pressKind} / Full Rect)
└─ AudioStreamPlayer: $${value.audioPlayerPath}`;

  const checklist = [
    "生成したスクリプトをWiredButtonHostのControlへ取り付けます。",
    `Buttonが $${value.buttonPath} に存在することを確認します。`,
    `FocusFeedbackを $${value.focusFeedbackPath} に置き、selection_feedback.gdを付けてFull Rectにします。`,
    `PressFeedbackを $${value.pressFeedbackPath} に置き、menu_feedback.gdを付けてFull Rectにします。`,
    `AudioStreamPlayerを $${value.audioPlayerPath} に置き、focus_soundとpressed_soundへ必要なWAVを割り当てます。`,
    "同じfocus_entered・focus_exited・pressedをInspector等で接続済みなら、二重発火を避けるため既存接続を外します。",
    "reduced_motionは視覚演出だけを静止化します。音量やミュートはアプリ側で別に設定します。",
  ];

  return { code, tree, checklist };
}
