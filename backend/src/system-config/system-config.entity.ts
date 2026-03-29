import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('system_config')
export class SystemConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  key: string;        // 如 'llm_api_url', 'llm_api_key', 'llm_model'

  @Column({ length: 500 })
  value: string;

  @Column({ length: 50, default: 'llm' })
  category: string;  // 配置分类
}
