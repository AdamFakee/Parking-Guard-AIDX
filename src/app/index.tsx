import {
  AppHeader,
  Button,
  Card,
  Input,
  LoadingIndicator,
  OptionCard,
  Placeholder,
} from '@/shared/components/ui';
import { COLORS } from '@/shared/constants';
import { Bell, Home, Search, Star } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function Index() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View className="mb-6">
      <Text className="text-sectionTitle font-bold text-brand-blue mb-3">{title}</Text>
      {children}
    </View>
  );

  return (
    <View className="flex-1 bg-app-darker">
      {/* AppHeader - Standard */}
      <AppHeader
        title="UI Components Demo"
        variant="surface"
        rightIcon={Bell}
        showLeftButton={false}
      />

      <ScrollView className="flex-1 px-md py-md" contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ---------- BUTTONS ---------- */}
        <Section title="Button">
          <View className="gap-3">
            <Button label="Primary Button" variant="primary" />
            <Button label="Outline Button" variant="outline" />
            <Button label="Secondary Button" variant="secondary" />
            <Button label="With Left Icon" variant="primary" leftIcon={Home} />
            <Button label="With Right Icon" variant="outline" rightIcon={Search} />
            <Button label="Loading State" variant="primary" loading={true} />
            <Button label="Disabled" variant="primary" disabled />
          </View>
        </Section>

        {/* ---------- APP HEADER VARIANTS ---------- */}
        <Section title="AppHeader">
          <View className="gap-3 overflow-hidden rounded-lg">
            <Text className="text-desc text-slate-400 mb-1">Surface (Default)</Text>
            <View className="overflow-hidden rounded-lg">
              <AppHeader
                title="Surface Header"
                variant="surface"
                rightIcon={Bell}
              />
            </View>
            <Text className="text-desc text-slate-400 mb-1 mt-2">Dark Variant</Text>
            <View className="overflow-hidden rounded-lg border border-slate-700">
              <AppHeader
                title="Dark Header"
                variant="dark"
                rightIcon={Star}
                showBorderBottom
              />
            </View>
          </View>
        </Section>

        {/* ---------- CONTAINER ---------- */}
        <Section title="Container">
          <View className="gap-3">
            <Card>
              <Text className="text-mainContent text-slate-100">Default Container</Text>
            </Card>
            <Card shadow>
              <Text className="text-mainContent text-slate-100">Container with Shadow</Text>
            </Card>
            <Card centered className="h-16">
              <Text className="text-mainContent text-slate-100">Centered Container</Text>
            </Card>
          </View>
        </Section>

        {/* ---------- INPUTS ---------- */}
        <Section title="Input">
          <View className="gap-3">
            <Input
              placeholder="Normal input..."
              value={inputValue}
              onChangeText={setInputValue}
            />
            <Input
              placeholder="Error state input..."
              error
            />
            <Input
              placeholder="Disabled input..."
              editable={false}
            />
          </View>
        </Section>

        {/* ---------- OPTION CARD ---------- */}
        <Section title="OptionCard">
          {['Option A', 'Option B', 'Option C'].map((opt) => (
            <OptionCard
              key={opt}
              text={opt}
              isSelected={selectedOption === opt}
              onPress={() => setSelectedOption(opt)}
              leftIcon={<Star size={20} color={selectedOption === opt ? COLORS.brand.blue : COLORS.slate[400]} />}
            />
          ))}
        </Section>

        {/* ---------- LOADING ---------- */}
        <Section title="LoadingIndicator">
          <View className="flex-row gap-6 items-center">
            <LoadingIndicator size="small" />
            <LoadingIndicator size="large" />
            <LoadingIndicator size="large" color={COLORS.brand.orange} />
          </View>
        </Section>

        {/* ---------- PLACEHOLDER ---------- */}
        <Section title="Placeholder">
          <View className="h-32 w-full overflow-hidden rounded-lg">
            <Placeholder text="Placeholder content" />
          </View>
        </Section>

      </ScrollView>
    </View>
  );
}